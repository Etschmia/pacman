declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private measurementId: string;
  private initialized: boolean = false;

  private constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
  }

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  public initialize(): void {
    if (this.initialized) {
      console.warn('AnalyticsManager already initialized');
      return;
    }

    if (!this.measurementId) {
      console.warn('VITE_GA_MEASUREMENT_ID not found in environment variables');
      return;
    }

    this.injectScript();
    this.initializeGtag();
    this.initialized = true;
    console.log('AnalyticsManager initialized with ID:', this.measurementId);
  }

  private injectScript(): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);
  }

  private initializeGtag(): void {
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    // @ts-ignore
    window.gtag = gtag;
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId);
  }

  public logEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!this.initialized) return;
    
    window.gtag('event', eventName, eventParams);
  }

  public logPageView(pagePath: string): void {
    if (!this.initialized) return;

    window.gtag('config', this.measurementId, {
      page_path: pagePath,
    });
  }
}

export const analyticsManager = AnalyticsManager.getInstance();
