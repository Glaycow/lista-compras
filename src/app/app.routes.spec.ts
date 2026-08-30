import {routes} from './app.routes';

describe('app.routes', () => {
  it('should redirect empty and unknown paths to shopping', () => {
    expect(routes[0]).toMatchObject({path: '', redirectTo: '/shopping'});
    expect(routes[routes.length - 1]).toMatchObject({path: '**', redirectTo: '/shopping'});
  });

  it('should lazy-load every page component', async () => {
    const loaders = routes
      .map((route) => route.loadComponent)
      .filter((load) => typeof load === 'function');

    expect(loaders.length).toBeGreaterThanOrEqual(4);

    const loaded = await Promise.all(loaders.map((load) => load!()));
    for (const component of loaded) {
      expect(component).toBeTruthy();
    }
  });
});
