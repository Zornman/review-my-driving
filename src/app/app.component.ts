import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'review-my-driving';
  private readonly siteUrl = 'https://www.reviewmydriving.co';
  private readonly defaultTitle = 'Review My Driving';
  private readonly defaultDescription = 'Review My Driving helps drivers and businesses with driving services, products, and support resources.';

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly meta: Meta,
    private readonly titleService: Title,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateSeoForRoute());

    this.updateSeoForRoute();
  }

  private updateSeoForRoute(): void {
    const activeRoute = this.getDeepestRoute(this.activatedRoute);
    const routeSnapshot = activeRoute.snapshot;

    const pageTitle = this.titleService.getTitle() || this.defaultTitle;
    const pageDescription = routeSnapshot.data['description'] || this.defaultDescription;
    const shouldNoindex = Boolean(routeSnapshot.data['noindex']);

    this.titleService.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:url', content: this.getCanonicalUrl() });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'robots', content: shouldNoindex ? 'noindex, nofollow' : 'index, follow' });

    this.updateCanonicalLink(this.getCanonicalUrl());
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let currentRoute = route;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    return currentRoute;
  }

  private getCanonicalUrl(): string {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    if (currentPath === '/') {
      return `${this.siteUrl}/`;
    }
    return `${this.siteUrl}${currentPath}`;
  }

  private updateCanonicalLink(url: string): void {
    let canonicalLink = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
  }
}
