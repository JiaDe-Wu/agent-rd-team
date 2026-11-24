// Page registry: { page name: { title: the name in the navigation, load: () => import('./<page name>.js') } }, and the first is the home page.
// Frontend developers add a line here when they add a page (page names use only lower-case letters and hyphens, the same as the file name).
export const pages = {
  home: { title: 'Home', load: () => import('./home.js') },
}
