import { Link } from 'react-router-dom'

export default function Participant() {
	return (
		<div className="min-h-screen relative overflow-hidden bg-black text-red-500">
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.06)_0%,rgba(0,0,0,1)_70%)]" aria-hidden="true"></div>
			<div className="absolute inset-0 mix-blend-screen opacity-25" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1350&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} aria-hidden="true"></div>

			<header className="relative z-10 flex items-center justify-between px-6 py-4">
				<Link to="/" className="text-sm text-red-400 hover:text-red-300">← Back</Link>
				<h1 className="text-xl tracking-widest font-extrabold text-red-600 st-glow">
					INNOSTRA ’25
				</h1>
				<div />
			</header>

			<main className="relative z-10 px-6 pb-24">
				<section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
					<Link to="/registration-committee/users" className="group neon-card">
						<div className="p-6">
							<h3 className="text-lg font-semibold text-red-400 group-hover:text-red-300">Register</h3>
							<p className="mt-2 text-sm text-red-300/80">Create a new participant registration for events and workshops.</p>
						</div>
					</Link>

					<Link to="/registration-committee/events" className="group neon-card">
						<div className="p-6">
							<h3 className="text-lg font-semibold text-red-400 group-hover:text-red-300">Browse Events</h3>
							<p className="mt-2 text-sm text-red-300/80">Explore technical, non-technical events and combos.</p>
						</div>
					</Link>

					<Link to="/registration-committee/attendance" className="group neon-card">
						<div className="p-6">
							<h3 className="text-lg font-semibold text-red-400 group-hover:text-red-300">Your Pass</h3>
							<p className="mt-2 text-sm text-red-300/80">Check your registrations and payment status.</p>
						</div>
					</Link>
				</section>

				<section className="max-w-5xl mx-auto mt-10 card bg-black/40 border border-red-900/40">
					<div className="p-6">
						<h3 className="text-red-400 font-semibold">About</h3>
						<p className="mt-2 text-sm text-red-300/80">This portal channels the aesthetics of Hawkins. Navigate carefully—some doors lead to the Upside Down.</p>
					</div>
				</section>
			</main>
		</div>
	)
}


