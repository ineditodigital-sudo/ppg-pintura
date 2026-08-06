import { Link } from 'react-router-dom'
import type { Navigation, Site } from '@/types/content'
import { ArrowUpRight, Container } from '@/components/ui'
import { DEFAULT_VIEWBOX, socialNetwork } from '@/lib/social'
import './Footer.css'

export function Footer({
  site,
  navigation,
}: {
  site: Site
  navigation: Navigation
}) {
  return (
    <footer className="footer">
      <Container>
        <div className="footer__top">
          <div className="footer__brand">
            <img
              src={site.footerLogo.src}
              alt={site.footerLogo.alt}
              width={site.footerLogo.width}
              height={site.footerLogo.height}
            />
            <p className="footer__tagline">{site.tagline}</p>
            <div className="footer__social">
              {site.social.map((item) => {
                const network = socialNetwork(item.network)

                return (
                  <a
                    key={item.network}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={network.label}
                    title={network.label}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox={network.viewBox ?? DEFAULT_VIEWBOX}
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d={network.path} />
                    </svg>
                  </a>
                )
              })}
            </div>
          </div>

          <nav className="footer__columns" aria-label="Enlaces del pie de página">
            {navigation.footer.map((group) => (
              <div className="footer__column" key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {link.label}
                          <ArrowUpRight size={13} />
                        </a>
                      ) : (
                        <Link to={link.href}>{link.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </Container>

      <div className="footer__bottom">
        <Container>
          <div className="footer__bottom-inner">
            <nav className="footer__legal" aria-label="Enlaces legales">
              {navigation.legal.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <p className="footer__copyright">{site.copyright}</p>
          </div>
        </Container>
      </div>
    </footer>
  )
}
