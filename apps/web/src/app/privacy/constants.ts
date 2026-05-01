export const PRIVACY_LAST_UPDATED = 'April 30, 2026';

export const PRIVACY_INTRO =
  'Fomo is a social platform built around local discovery, events, maps, and shared experiences. This page explains the kinds of information Fomo may collect and how that information may be used when you use the app or related web pages.';

export const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    body: [
      'Fomo may collect information you provide directly, including account details, profile information, event details, posts, friend activity, and messages submitted through our support form.',
      'If you allow location access, Fomo may collect location information to help show nearby events, map activity, and other location-based features.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'We use collected information to operate the app, personalize maps and recommendations, support RSVP and social features, maintain account security, and respond to support requests.',
      'We may also use service-related data to troubleshoot bugs, improve reliability, and understand how Fomo is being used.',
    ],
  },
  {
    title: 'Third-Party Services',
    body: [
      'Fomo uses third-party infrastructure and services that may process data on our behalf, including Clerk for authentication, Convex for backend data storage and sync, and Mapbox for maps and location-related experiences.',
      'These providers may process the data needed to deliver their parts of the service under their own terms and privacy practices.',
    ],
  },
  {
    title: 'Sharing and Disclosure',
    body: [
      'Information you choose to post or place on your profile may be visible to other users depending on how the feature is designed in the app.',
      'We may also disclose information when needed to comply with legal obligations, protect users, enforce our terms, or maintain the security and integrity of Fomo.',
    ],
  },
  {
    title: 'Your Choices',
    body: [
      'You can choose whether to grant location permissions on your device, and you can limit what information you post, upload, or include on your profile.',
      'If you need help with privacy-related questions or requests, use the support page available on the Fomo website.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'For privacy questions, support requests, or questions about this policy, contact the Fomo team through our support page.',
    ],
  },
] as const;
