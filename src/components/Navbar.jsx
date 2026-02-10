export default function Navbar() {
  return (
    <nav className="navbar">
      <a href="/" className="navbar__brand">TrueCost</a>
      <div className="navbar__links">
        <a href="/login" className="navbar__link">Log in</a>
        <a href="/register" className="btn btn-primary btn--sm">Get started</a>
      </div>
    </nav>
  )
}
