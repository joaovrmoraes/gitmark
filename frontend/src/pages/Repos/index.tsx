import { ReposDesktop } from './Repos.desktop'
import { ReposMobile } from './Repos.mobile'

export default function ReposPage() {
  return (
    <>
      <div className="hidden md:block"><ReposDesktop /></div>
      <div className="md:hidden"><ReposMobile /></div>
    </>
  )
}
