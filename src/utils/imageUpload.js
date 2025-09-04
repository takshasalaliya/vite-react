// Image upload utility with multiple fallback options
export const uploadImage = async (file) => {
  try {
    // First, try to upload to ImgBB
    const imgbbUrl = await uploadToImgBB(file)
    if (imgbbUrl) {
      return imgbbUrl
    }
  } catch (error) {
    console.warn('ImgBB upload failed, trying fallback:', error)
  }

  // Fallback: Convert to base64 and store locally
  return await convertToBase64(file)
}

// Upload to ImgBB
const uploadToImgBB = async (file) => {
  try {
    const reader = new FileReader()
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
    })
    reader.readAsDataURL(file)
    const base64Data = await base64Promise

    const formData = new FormData()
    formData.append('image', base64Data)

    // Do NOT pass any expiration parameter to avoid time-limited links
    const response = await fetch('https://api.imgbb.com/1/upload?key=df36e8fe0c8bca3199500f788d8fc1da', {
      method: 'POST',
      body: formData,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      // Prefer the direct image URL which does not expire
      // Fallback to display_url if image.url is missing
      return result.data?.image?.url || result.data?.display_url || result.data?.url
    } else {
      throw new Error(result.error?.message || 'Failed to upload image')
    }
  } catch (error) {
    console.error('ImgBB upload error:', error)
    throw error
  }
}

// Convert to base64 as fallback
const convertToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Validate image file
export const validateImage = (file) => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB')
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
  }

  return true
}
