import { auth } from 'express-oauth2-jwt-bearer'

const domain = process.env.AUTH0_DOMAIN
const audience = process.env.AUTH0_AUDIENCE

// JWT validation middleware - only created when Auth0 is configured
const checkJwt = domain && audience
  ? auth({
      audience,
      issuerBaseURL: `https://${domain}`,
    })
  : null

// Extract user from JWT and attach to req
export function attachUser(req, res, next) {
  if (req.auth?.payload?.sub) {
    req.userId = req.auth.payload.sub
    req.userEmail = req.auth.payload.email
  }
  next()
}

// Auth middleware: validates JWT when Auth0 configured, else uses dev user
export function optionalAuth(req, res, next) {
  if (!checkJwt) {
    req.userId = 'dev-user'
    req.userEmail = 'dev@localhost'
    return next()
  }
  checkJwt(req, res, (err) => {
    if (err) return next(err)
    attachUser(req, res, next)
  })
}
