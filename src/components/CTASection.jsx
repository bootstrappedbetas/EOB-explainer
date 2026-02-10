export default function CTASection() {
  return (
    <section className="cta">
      <div className="cta__content">
        <h2 className="cta__title">Ready to get started?</h2>
        <p className="cta__subtitle">
          Upload your Explanation of Benefits and take control of your healthcare costs.
        </p>
        <div className="cta__actions">
          <a href="/register" className="btn btn-primary btn--lg">
            Get started with TrueCost
          </a>
          <a href="/login" className="cta__link">
            Already have an account? Log in
          </a>
        </div>
      </div>
    </section>
  )
}
