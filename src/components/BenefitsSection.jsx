import { LockIcon, ZapIcon, SparklesIcon, EyeIcon, DollarIcon } from './icons'

export default function BenefitsSection() {
  const benefits = [
    {
      icon: LockIcon,
      title: 'HIPAA Compliant & Secure',
      description: 'Your data is secure and confidential. We take privacy seriously.',
    },
    {
      icon: ZapIcon,
      title: 'No technical skills needed',
      description: 'Upload and track your Explanation of Benefits in one place.',
    },
    {
      icon: SparklesIcon,
      title: 'AI-powered summaries',
      description: 'High-level insights delivered in seconds.',
    },
    {
      icon: EyeIcon,
      title: 'Price transparency',
      description: 'Find out what you pay vs. what others pay for the same care.',
    },
    {
      icon: DollarIcon,
      title: 'Straightforward pricing',
      description: '$10 per month — money back if you\'re not satisfied.',
    },
  ]

  return (
    <section className="section benefits">
      <h2 className="section-title">Why TrueCost</h2>
      <p className="section-subtitle">
        Built to give you clarity and control over your healthcare spending
      </p>
      <div className="benefits__grid">
        {benefits.map(({ icon: Icon, title, description }) => (
          <article key={title} className="benefit-card">
            <div className="benefit-card__icon">
              <Icon />
            </div>
            <h3 className="benefit-card__title">{title}</h3>
            <p className="benefit-card__description">{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
