export default function HeroSection() {
  return (
    <header className="hero">
      <div className="hero__content">
        <span className="hero__badge">Healthcare cost transparency</span>
        <h1 className="hero__title">
          Discover the true cost of your healthcare
        </h1>
        <p className="hero__subtitle">
          EOB explained helps you understand the true cost of your healthcare,
          how your price compares to others, and whether you were overcharged
          for your medical care.
        </p>
        <div className="hero__actions">
          <a href="/register" className="btn btn-primary">
            Get started with TrueCost
          </a>
          <a href="#how-it-works" className="btn btn-secondary">
            See how it works
          </a>
        </div>
      </div>
      <div className="hero__visual">
        <div className="hero__card">
          <div className="hero__card-row">
            <span className="hero__card-label">Procedure</span>
            <span className="hero__card-value">Lab work</span>
          </div>
          <div className="hero__card-row">
            <span className="hero__card-label">Billed</span>
            <span className="hero__card-value hero__card-value--high">$847</span>
          </div>
          <div className="hero__card-row">
            <span className="hero__card-label">Typical cost</span>
            <span className="hero__card-value hero__card-value--low">$142</span>
          </div>
        </div>
      </div>
    </header>
  )
}
