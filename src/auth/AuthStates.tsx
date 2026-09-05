type AuthorizationRequiredStateProps = {
  message?: string
}

export function AuthorizationRequiredState({
  message = 'Sign in and choose a business before continuing.',
}: AuthorizationRequiredStateProps) {
  return (
    <section aria-labelledby="authorization-required">
      <h2 id="authorization-required">Authorization required</h2>
      <p>{message}</p>
    </section>
  )
}

export function PermissionDeniedState({
  message = 'You do not have permission to perform this operation.',
}: AuthorizationRequiredStateProps) {
  return (
    <section role="alert" aria-labelledby="permission-denied">
      <h2 id="permission-denied">Permission denied</h2>
      <p>{message}</p>
    </section>
  )
}
