/*
 * Authorization presentation now comes from the shared design-system states
 * so authorization surfaces look the same everywhere. Domain-specific copy
 * stays with the caller through the message props.
 */
export { AuthorizationRequiredState, PermissionDeniedState } from '../ui/states'
