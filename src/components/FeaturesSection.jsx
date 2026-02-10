export default function FeaturesSection() {
  const features = [
    {
      icon: UploadIcon,
      title: 'Upload your Explanation of Benefits',
      description:
        'Connect your insurance information through individual uploads or directly through your insurance company app.',
    },
    {
      icon: ChartIcon,
      title: 'Understand what it means',
      description:
        'See what was charged, what codes were used, and how it compares to others.',
    },
    {
      icon: ShieldIcon,
      title: 'Reduce your costs today',
      description:
        'Negotiate for a better price based on real data from other patients.',
    },
  ]

  return (
    <section id="how-it-works" className="section features">
      <h2 className="section-title">Your EOB, actually explained</h2>
      <p className="section-subtitle">
        Three simple steps to take control of your healthcare costs
      </p>
      <div className="features__grid">
        {features.map(({ icon: Icon, title, description, image }, i) => (
          <article key={title} className="feature-card">
            <div className="feature-card__icon">
              <Icon />
            </div>
            <h3 className="feature-card__title">{title}</h3>
            <p className="feature-card__description">{description}</p>
            {image && (
              <div className="feature-card__image">
                <img src={image} alt={title} />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
