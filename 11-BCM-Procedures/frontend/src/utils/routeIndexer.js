import Fuse from 'fuse.js';

// Function to extract routes from React Router configuration
export const extractRoutesFromApp = (routes) => {
  const routeList = [];

  const traverseRoutes = (routes, parentPath = '') => {
    routes.forEach(route => {
      if (route.path && route.element) {
        const fullPath = parentPath + '/' + route.path;
        const cleanPath = fullPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

        // Generate human-readable name from path
        const name = generateRouteName(cleanPath);

        routeList.push({
          path: cleanPath,
          name: name,
          description: generateRouteDescription(name),
          keywords: generateKeywords(cleanPath, name)
        });
      }

      if (route.children) {
        traverseRoutes(route.children, route.path ? parentPath + '/' + route.path : parentPath);
      }
    });
  };

  traverseRoutes(routes);
  return routeList;
};

// Generate human-readable name from path
const generateRouteName = (path) => {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) return 'Home';

  const nameSegments = segments.map(segment => {
    // Handle dynamic routes like :id
    if (segment.startsWith(':')) {
      return segment.replace(':', '').replace('-', ' ');
    }

    // Convert kebab-case and snake_case to Title Case
    return segment
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  return nameSegments.join(' - ');
};

// Generate description for route
const generateRouteDescription = (name) => {
  const descriptions = {
    'Home': 'Main dashboard and overview',
    'Business Impact Analysis': 'Analyze and assess business impact',
    'Process Service Mapping': 'Map processes and services',
    'Risk Matrix': 'Visual risk assessment matrix',
    'Overview': 'General overview and summary',
    'Reports': 'Generate and view reports',
    'Settings': 'Application settings and configuration',
    'Admin': 'Administrative functions',
    'Login': 'User authentication',
    'Profile': 'User profile management'
  };

  // Try to match partial names
  for (const [key, desc] of Object.entries(descriptions)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return desc;
    }
  }

  return `Access the ${name} section`;
};

// Generate searchable keywords
const generateKeywords = (path, name) => {
  const keywords = new Set();

  // Add path segments
  path.split('/').filter(Boolean).forEach(segment => {
    keywords.add(segment.replace(/[-_]/g, ' '));
    keywords.add(segment);
  });

  // Add name words
  name.split(' ').forEach(word => {
    keywords.add(word.toLowerCase());
    keywords.add(word);
  });

  // Add common synonyms
  const synonyms = {
    'bia': ['business impact analysis', 'impact analysis'],
    'dashboard': ['home', 'overview', 'main'],
    'reports': ['export', 'download', 'generate'],
    'admin': ['administration', 'management'],
    'profile': ['account', 'user', 'settings']
  };

  name.toLowerCase().split(' ').forEach(word => {
    if (synonyms[word]) {
      synonyms[word].forEach(syn => keywords.add(syn));
    }
  });

  return Array.from(keywords);
};

// Create Fuse.js instance for searching
export const createRouteSearcher = (routes) => {
  const fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    keys: [
      {
        name: 'name',
        weight: 0.4
      },
      {
        name: 'keywords',
        weight: 0.6
      }
    ]
  };

  return new Fuse(routes, fuseOptions);
};

// Search for routes based on query
export const searchRoutes = (query, routes) => {
  if (!query.trim()) return [];

  const searcher = createRouteSearcher(routes);
  const results = searcher.search(query);

  return results.map(result => ({
    ...result.item,
    score: result.score
  })).sort((a, b) => a.score - b.score);
};

// Get best match for a query
export const getBestRouteMatch = (query, routes) => {
  const matches = searchRoutes(query, routes);
  return matches.length > 0 ? matches[0] : null;
};
