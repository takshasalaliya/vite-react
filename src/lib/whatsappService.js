// WhatsApp messaging service using Fonnte API
const FONNTE_API_URL = 'https://api.fonnte.com/send'
const FONNTE_TOKEN = import.meta.env.VITE_FONNTE_TOKEN || 'YOUR_FONNTE_TOKEN_HERE'

export const sendWhatsAppMessage = async (phoneNumber, message, options = {}) => {
  try {
    // Debug: Check if token is loaded
    console.log('Fonnte Token:', FONNTE_TOKEN ? 'Loaded' : 'Not loaded')
    console.log('Token value:', FONNTE_TOKEN)
    
    if (!FONNTE_TOKEN || FONNTE_TOKEN === 'YOUR_FONNTE_TOKEN_HERE') {
      throw new Error('Fonnte token not configured. Please set VITE_FONNTE_TOKEN in your environment variables.')
    }

    // Ensure phone number has +91 country code
    let formattedPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    
    // Add +91 if not present
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone
    }
    
    // Remove leading zero if present
    if (formattedPhone.startsWith('091')) {
      formattedPhone = formattedPhone.substring(1)
    }

    console.log('Formatted phone:', formattedPhone)
    console.log('Message:', message)

    const payload = {
      target: formattedPhone,
      message: message,
      countryCode: '91', // India country code
      delay: '2',
      typing: false,
      ...options
    }

    console.log('Payload:', payload)

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    
    if (result.status) {
      console.log('WhatsApp message sent successfully:', result)
      return { success: true, data: result }
    } else {
      console.error('WhatsApp message failed:', result)
      return { success: false, error: result.reason || 'Unknown error' }
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error: error.message }
  }
}

export const sendRegistrationSuccessMessage = async (userData) => {
  const { name, phone, email } = userData
  
  const message = `🎉 *Registration Successful!*

Hello ${name},

Your registration has been completed successfully!

📧 *ID:* ${email}
🔑 *Password:* ${phone}

You can now:
• Login to your dashboard
• View your registered events
• Check attendance status
• Download your QR code

Thank you for registering with us!

Best regards,
Event Management Team

wesite link:- https://innostra.vercel.app

📩 For any queries, please contact Rudra Patel: +919426532062`

  return await sendWhatsAppMessage(phone, message)
}

export const sendPaymentConfirmationMessage = async (userData, paymentDetails) => {
  const { name, phone, email } = userData
  const { amount, transactionId, events } = paymentDetails
  
  const eventList = events.map(event => `• ${event.name}`).join('\n')
  
  const message = `💰 *Payment Confirmation*

Hello ${name},

Your payment has been received successfully!

📧 *Email:* ${email}
💳 *Amount:* ₹${amount}
🆔 *Transaction ID:* ${transactionId}

📋 *Registered Events:*
${eventList}

Your registration is now complete and you can access all event features.

Thank you for your payment!

Best regards,
Event Management Team`

  return await sendWhatsAppMessage(phone, message)
}

export const sendAttendanceConfirmationMessage = async (userData, eventDetails) => {
  const { name, phone } = userData
  const { eventName, timestamp } = eventDetails
  
  const message = `✅ *Attendance Confirmed*

Hello ${name},

Your attendance has been recorded for:
🎯 *Event:* ${eventName}
⏰ *Time:* ${new Date(timestamp).toLocaleString('en-IN')}

Keep up the great participation!

Best regards,
Event Management Team`

  return await sendWhatsAppMessage(phone, message)
}

// Test function to verify token and API connection
export const testWhatsAppConnection = async () => {
  try {
    console.log('Testing WhatsApp connection...')
    console.log('Token:', FONNTE_TOKEN)
    
    if (!FONNTE_TOKEN || FONNTE_TOKEN === 'YOUR_FONNTE_TOKEN_HERE') {
      return { success: false, error: 'Token not configured' }
    }

    // Test with a simple message to a test number
    const testResult = await sendWhatsAppMessage('919876543210', 'Test message from Event Management System')
    return testResult
  } catch (error) {
    console.error('WhatsApp connection test failed:', error)
    return { success: false, error: error.message }
  }
}
