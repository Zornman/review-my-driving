import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  color: string;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface PricingTier {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

@Component({
  selector: 'app-products-and-services',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './products-and-services.component.html',
  styleUrl: './products-and-services.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class ProductsAndServicesComponent implements OnInit {
  services: Service[] = [];
  benefits: Benefit[] = [];
  pricingTiers: PricingTier[] = [];
  expandedService: string | null = null;
  activeTab: 'features' | 'benefits' | 'pricing' = 'features';

  ngOnInit(): void {
    this.initializeServices();
    this.initializeBenefits();
    this.initializePricingTiers();
  }

  private initializeServices(): void {
    this.services = [
      {
        id: 'qr-codes',
        title: 'Custom QR Code Solutions',
        description: 'Embed driving feedback directly into your physical presence with branded QR codes. Perfect for any fleet size.',
        icon: 'qr_code_2',
        features: [
          'Unlimited QR code generation',
          'Branded product integration',
          'Scalable for any fleet size',
          'Automatic uniqueId tracking',
          'Seamless user experience',
          'Analytics & feedback routing'
        ],
        color: '#3f51b5'
      },
      {
        id: 'daily-reports',
        title: 'Driver Daily Reports',
        description: 'Streamlined end-of-day reporting system for truck drivers with photo verification and real-time tracking.',
        icon: 'assignment',
        features: [
          'Magic link email delivery',
          'Odometer & mileage tracking',
          'Issue documentation',
          'Photo uploads (4-slot system)',
          'Token-based security',
          'Automated scheduling & reminders'
        ],
        color: '#4caf50'
      },
      {
        id: 'fleet-management',
        title: 'Fleet & Driver Management',
        description: 'Comprehensive dashboard for managing trucks, drivers, and assignments with full audit trails.',
        icon: 'directions_car',
        features: [
          'Truck registration tracking',
          'Driver license management',
          'Vehicle assignment system',
          'Status monitoring',
          'Address & contact management',
          'Deletion audit trail'
        ],
        color: '#ff9800'
      },
      {
        id: 'analytics',
        title: 'Driver Feedback & Analytics',
        description: 'Aggregate and analyze driving behavior reviews to identify trends and improve fleet performance.',
        icon: 'analytics',
        features: [
          'Real-time submission tracking',
          'Feedback categorization',
          'Driver performance insights',
          'Historical data analysis',
          'Customizable reports',
          'Trend identification'
        ],
        color: '#e91e63'
      },
      {
        id: 'business-tools',
        title: 'Business Settings & Customization',
        description: 'Flexible configuration options to tailor the platform to your business needs and workflow.',
        icon: 'settings',
        features: [
          'Timezone management',
          'Notification preferences',
          'Email notification controls',
          'Daily summary reports',
          'Custom start/end windows',
          'Multi-user support'
        ],
        color: '#2196f3'
      },
      {
        id: 'support',
        title: 'Dedicated Support',
        description: 'Expert guidance and support to maximize your fleet\'s use of Review My Driving.',
        icon: 'support_agent',
        features: [
          'Setup assistance',
          'Driver training resources',
          'Technical support',
          'Best practices consultation',
          'Integration help',
          'Performance optimization'
        ],
        color: '#009688'
      }
    ];
  }

  private initializeBenefits(): void {
    this.benefits = [
      {
        icon: 'security',
        title: 'Secure & Reliable',
        description: 'Secure authentication and access controls, with time-limited tokens for daily-report links.'
      },
      {
        icon: 'speed',
        title: 'Lightning Fast',
        description: 'Cloud-powered infrastructure ensures instant feedback delivery and real-time updates.'
      },
      {
        icon: 'trending_up',
        title: 'Data-Driven Insights',
        description: 'Make informed decisions with reporting views for feedback and daily-report completion.'
      },
      {
        icon: 'people',
        title: 'Easy Collaboration',
        description: 'Multi-user support for your entire team to manage drivers and fleet operations seamlessly.'
      },
      {
        icon: 'devices',
        title: 'Mobile Optimized',
        description: 'Fully responsive design works perfectly on phones, tablets, and desktops.'
      },
      {
        icon: 'auto_awesome',
        title: 'Automated Workflows',
        description: 'Scheduled report generation and automated email delivery save time and reduce manual work.'
      }
    ];
  }

  private initializePricingTiers(): void {
    this.pricingTiers = [
      {
        name: 'Core Platform',
        description: 'For small fleets that want daily reports + truck/driver management (no custom design required)',
        price: 'Quote-based',
        period: '',
        features: [
          'Truck & driver management',
          'Vehicle QR codes (standard)',
          'Feedback collection + routing',
          'Automated daily reports (magic links)',
          'Photo uploads for verification',
          'Business settings (timezone + report windows)'
        ],
        highlighted: true,
        cta: 'Talk to Us'
      },
      {
        name: 'Optional Add-Ons',
        description: 'For teams that want a more tailored rollout and branded assets',
        price: 'As needed',
        period: '',
        features: [
          'One-time setup & onboarding assistance',
          'Initial data import / configuration help',
          'Custom QR design / branded assets',
          'Workflow customization and rollout planning',
          'Integration planning (if needed)'
        ],
        highlighted: false,
        cta: 'Ask About Add-Ons'
      }
    ];
  }

  toggleService(serviceId: string): void {
    this.expandedService = this.expandedService === serviceId ? null : serviceId;
  }

  isServiceExpanded(serviceId: string): boolean {
    return this.expandedService === serviceId;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  contactSales(): void {
    window.location.href = '/contact';
  }
}
