import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import Map from './Map';
import { fetchNomsters, fetchProfile } from './api';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const signedOutRoot = createRootRoute({
  component: () => <Outlet />
});
const signedOutRouteTree = signedOutRoot.addChildren([
  createRoute({
    getParentRoute: () => signedOutRoot,
    path: '/',
    component: () => <SignIn signUpUrl='/signup' />
  }),
  createRoute({
    getParentRoute: () => signedOutRoot,
    path: '/signup',
    component: () => <SignUp signInUrl='/' />
  }),
]);
const signedOutRouter = createRouter({ routeTree: signedOutRouteTree });

const signedInRoot = createRootRoute({
  component: () => <Outlet />
});
const signedInRouteTree = signedInRoot.addChildren([
  createRoute({
    getParentRoute: () => signedInRoot,
    path: '/',
    component: () => <Map />,
    loader: async () => ({
      nomsters: await fetchNomsters(),
      profile: await fetchProfile()
    })
  })
]);
const signedInRouter = createRouter({ routeTree: signedInRouteTree });

function App() {
  return (
    <>
      <header>
        <h1>Nomsters</h1>
        <p>Eat 'em all!</p>
      </header>
      <main>
        <ClerkProvider publishableKey={CLERK_KEY}>
          <SignedOut>
            <RouterProvider router={signedOutRouter} />
          </SignedOut>
          <SignedIn>
            <RouterProvider router={signedInRouter} />
          </SignedIn>
        </ClerkProvider>
      </main>
    </>
  );
}

export default App;
