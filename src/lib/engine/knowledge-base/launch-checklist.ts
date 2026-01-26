/**
 * Comprehensive Launch Checklist for First-Time App Publishers
 *
 * This guide walks complete beginners through the entire App Store submission process.
 * Each item explains not just WHAT to do, but WHY it matters and HOW to do it.
 *
 * Target audience: Developers who have never published an iOS app before.
 */

export type ChecklistPhase = 'pre_submission' | 'during_review' | 'post_approval';

export type ChecklistCategory =
    | 'account_setup'
    | 'app_preparation'
    | 'metadata'
    | 'screenshots_media'
    | 'legal_privacy'
    | 'testing'
    | 'submission'
    | 'review_process'
    | 'communication'
    | 'launch_marketing'
    | 'optimization'
    | 'maintenance';

export interface ChecklistItem {
    id: string;
    phase: ChecklistPhase;
    category: ChecklistCategory;
    title: string;
    description: string;
    why_it_matters: string;
    how_to_do_it: string;
    helpful_link?: string;
    estimated_time?: string;
    category_specific?: string[];  // Only show for certain app categories
    is_required: boolean;
    order: number;  // For sorting within phase
}

export const LAUNCH_CHECKLIST: ChecklistItem[] = [
    // ============================================
    // PHASE 1: PRE-SUBMISSION
    // ============================================

    // --- Account Setup ---
    {
        id: 'create-developer-account',
        phase: 'pre_submission',
        category: 'account_setup',
        title: 'Create an Apple Developer Account',
        description: 'This is your gateway to the App Store. Without it, you cannot submit apps. It costs $99/year and gives you access to App Store Connect, TestFlight, and all the tools you need to publish.',
        why_it_matters: 'You literally cannot publish an app without this account. Apple uses it to verify you\'re a real developer and to pay you when your app makes money. It also gives you access to beta testing tools and app analytics.',
        how_to_do_it: `1. Go to developer.apple.com/programs/enroll
2. Sign in with your Apple ID (or create one)
3. Choose "Individual" if you're a solo developer, or "Organization" if you're a company (Organization requires a D-U-N-S number - this takes extra time!)
4. Pay the $99/year fee
5. Wait for Apple to verify your account (usually 24-48 hours, but can take up to 2 weeks for organizations)

Pro tip: Use the same Apple ID you use for development. Don't create a separate one - it causes headaches later.`,
        helpful_link: 'https://developer.apple.com/programs/enroll/',
        estimated_time: '15 minutes to apply, 24-48 hours for approval',
        is_required: true,
        order: 1,
    },
    {
        id: 'setup-app-store-connect',
        phase: 'pre_submission',
        category: 'account_setup',
        title: 'Set Up App Store Connect',
        description: 'App Store Connect is where you manage everything about your app on the App Store - from uploading builds to viewing sales data. Think of it as your app\'s control center.',
        why_it_matters: 'This is where you\'ll upload your app, write your App Store description, add screenshots, set pricing, respond to reviews, and track downloads. You\'ll spend a lot of time here, so get familiar with it.',
        how_to_do_it: `1. Go to appstoreconnect.apple.com
2. Sign in with your Developer Account Apple ID
3. Accept all the agreements (there are several - they update periodically)
4. Explore the interface:
   - "My Apps" - where you create and manage apps
   - "Users and Access" - add team members
   - "Agreements, Tax, and Banking" - get paid
   - "Sales and Trends" - track downloads and revenue

First time tip: Don't try to create your app yet. First, finish the banking/tax setup - it's required before you can submit anyway.`,
        helpful_link: 'https://appstoreconnect.apple.com',
        estimated_time: '10 minutes',
        is_required: true,
        order: 2,
    },
    {
        id: 'setup-banking-tax',
        phase: 'pre_submission',
        category: 'account_setup',
        title: 'Set Up Banking and Tax Information',
        description: 'Before Apple can pay you (even for a free app with ads), you need to provide banking details and tax information. This is also required before you can submit ANY app.',
        why_it_matters: 'Apple won\'t even let you submit your app until this is complete. Many first-time developers get stuck here because they skip this step and wonder why the "Submit for Review" button is grayed out. Even if your app is free, Apple needs this info in case you add in-app purchases later.',
        how_to_do_it: `1. In App Store Connect, go to "Agreements, Tax, and Banking"
2. You'll see several agreements - accept them all:
   - Paid Applications (even if your app is free - just accept it)
   - Free Applications
3. For Banking:
   - Enter your bank account details
   - Apple will send a small test deposit to verify
4. For Tax:
   - Fill out the tax forms (W-9 for US, W-8BEN for non-US)
   - This determines how much tax Apple withholds from your earnings

Common mistake: People think "my app is free so I'll skip this." Wrong! You still need to complete it or you can't submit.`,
        helpful_link: 'https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements',
        estimated_time: '20-30 minutes',
        is_required: true,
        order: 3,
    },
    {
        id: 'create-app-record',
        phase: 'pre_submission',
        category: 'account_setup',
        title: 'Create Your App in App Store Connect',
        description: 'Before you can upload anything, you need to create an "app record" - basically telling Apple "I\'m going to submit an app called X." This reserves your app\'s spot and bundle ID.',
        why_it_matters: 'The app record is like a placeholder that holds all your app\'s information. You\'ll fill this in over time with your description, screenshots, and eventually your actual app binary. Your Bundle ID gets locked in here and can never be changed.',
        how_to_do_it: `1. In App Store Connect, click the + button next to "Apps"
2. Select "New App"
3. Fill in the required fields:
   - Platform: iOS (or whatever you're building for)
   - Name: Your app's name (must be unique on the App Store!)
   - Primary Language: Usually English
   - Bundle ID: Must match what's in your Xcode project EXACTLY
   - SKU: A unique identifier for your records (e.g., "myapp-v1")
4. Click Create

Important: The Bundle ID cannot be changed later. Double-check it matches your Xcode project (in Xcode: Project > General > Bundle Identifier). If it doesn't match, your upload will fail.`,
        helpful_link: 'https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app',
        estimated_time: '5 minutes',
        is_required: true,
        order: 4,
    },

    // --- App Preparation ---
    {
        id: 'set-bundle-id',
        phase: 'pre_submission',
        category: 'app_preparation',
        title: 'Verify Your Bundle Identifier',
        description: 'Your Bundle ID is your app\'s unique identity - like a social security number. It\'s usually in the format "com.yourcompany.appname" and must match between Xcode and App Store Connect.',
        why_it_matters: 'If your Bundle ID in Xcode doesn\'t exactly match what you set in App Store Connect, your upload will fail. This is the #1 reason first uploads fail. Once registered, you can never reuse a Bundle ID, even if you delete the app.',
        how_to_do_it: `1. In Xcode, select your project in the navigator
2. Select your app target
3. Go to the "Signing & Capabilities" tab
4. Look at "Bundle Identifier" - this must match exactly what you put in App Store Connect

Format tips:
- Use reverse domain notation: com.yourcompany.appname
- All lowercase
- No spaces (use hyphens if needed)
- Keep it short but descriptive

Example: com.szakacsmedia.vero`,
        estimated_time: '2 minutes',
        is_required: true,
        order: 5,
    },
    {
        id: 'set-version-build',
        phase: 'pre_submission',
        category: 'app_preparation',
        title: 'Set Version and Build Numbers',
        description: 'Your app has two numbers: the Version (what users see, like "1.0") and the Build number (internal tracking, like "1" or "100"). Understanding these prevents upload rejections.',
        why_it_matters: 'Apple rejects uploads where the build number hasn\'t been incremented. Every single upload must have a higher build number than the last one. Version numbers are what users see in the App Store and should follow semantic versioning.',
        how_to_do_it: `1. In Xcode, select your project
2. Select your app target
3. Go to the "General" tab
4. Find "Version" and "Build":
   - Version: What users see (e.g., "1.0.0")
   - Build: Must increase with every upload (e.g., "1", "2", "3")

Best practices:
- Version: Use semantic versioning (Major.Minor.Patch) - e.g., 1.0.0
- Build: Just increment by 1 each upload, or use date format (20240115)

Common mistake: Forgetting to increment the build number before uploading. Each upload to App Store Connect must have a unique, higher build number.`,
        estimated_time: '2 minutes',
        is_required: true,
        order: 6,
    },
    {
        id: 'configure-signing',
        phase: 'pre_submission',
        category: 'app_preparation',
        title: 'Configure Code Signing',
        description: 'Code signing proves your app came from you and hasn\'t been tampered with. Xcode can handle this automatically, but you need to make sure it\'s set up correctly.',
        why_it_matters: 'Without proper code signing, Apple will reject your app immediately. It\'s how they verify you\'re the legitimate developer. This is one of the most confusing parts for beginners, but Xcode\'s "Automatic" signing makes it much easier now.',
        how_to_do_it: `1. In Xcode, select your project
2. Select your app target
3. Go to "Signing & Capabilities"
4. Check "Automatically manage signing"
5. Select your Team (your Developer Account)
6. Xcode should show green checkmarks - if you see errors, click "Try Again" or check your internet connection

If you see "No profiles found":
- Make sure you're signed into your Developer Account in Xcode (Xcode > Preferences > Accounts)
- The Bundle ID must be registered (it auto-registers when you first build)

Note: Use "Apple Distribution" for App Store builds, not "Development".`,
        helpful_link: 'https://developer.apple.com/documentation/xcode/configuring-code-signing',
        estimated_time: '5 minutes',
        is_required: true,
        order: 7,
    },
    {
        id: 'archive-app',
        phase: 'pre_submission',
        category: 'app_preparation',
        title: 'Archive Your App in Xcode',
        description: 'Archiving creates a special build of your app that\'s ready for the App Store. It\'s different from just "building" - it packages everything up with proper signing for distribution.',
        why_it_matters: 'You can\'t upload a regular development build to the App Store. The archive is a production-ready package with all the right signatures and optimizations. This is also where many hidden issues surface, so it\'s good to do this early.',
        how_to_do_it: `1. Connect a real iOS device OR select "Any iOS Device" in the scheme selector (top left of Xcode)
   - You CANNOT archive while a simulator is selected!
2. Go to Product > Archive
3. Wait for the build to complete (this takes longer than a normal build)
4. When done, the Organizer window opens automatically
5. You should see your app listed with today's date

If Archive is grayed out:
- Make sure you selected a real device or "Any iOS Device"
- Make sure your scheme is set to Release, not Debug

If the build fails:
- Check the error messages carefully
- Common issues: missing provisioning profiles, code signing errors, missing assets`,
        helpful_link: 'https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases',
        estimated_time: '5-15 minutes depending on app size',
        is_required: true,
        order: 8,
    },
    {
        id: 'upload-to-app-store',
        phase: 'pre_submission',
        category: 'app_preparation',
        title: 'Upload Your App to App Store Connect',
        description: 'Once archived, you can upload directly to App Store Connect. This sends your app to Apple\'s servers where it gets processed and made available for review.',
        why_it_matters: 'This is the actual transfer of your app to Apple. Processing can take 10-30 minutes after upload, and you might discover issues (like missing icons or invalid architectures) that weren\'t obvious before.',
        how_to_do_it: `1. In the Organizer (Window > Organizer), select your archive
2. Click "Distribute App"
3. Select "App Store Connect" > Next
4. Select "Upload" > Next
5. Keep the default options checked (usually all should be checked)
6. Select your Distribution Certificate and Profile (or let Xcode manage it)
7. Click Upload
8. Wait for the upload to complete (can take 5-30 minutes for larger apps)

After upload:
- Go to App Store Connect
- Navigate to your app > TestFlight (or Activity tab)
- You'll see your build processing (yellow icon)
- Wait for processing to complete (10-30 minutes)
- If it shows a red icon, check for error messages

Common upload errors:
- "No suitable application records found" - Bundle ID mismatch
- "Invalid binary" - Usually a signing or icon issue
- "Missing compliance" - Your app uses encryption (fill out the export compliance)`,
        helpful_link: 'https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds',
        estimated_time: '10-30 minutes',
        is_required: true,
        order: 9,
    },

    // --- Metadata ---
    {
        id: 'write-app-name',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Write Your App Name (30 characters max)',
        description: 'Your app name is what appears under the icon and in search results. You have only 30 characters, so make them count. This is often the first thing potential users see.',
        why_it_matters: 'Your app name is crucial for discoverability and first impressions. Apple will reject names that include pricing ("Free!"), platform names ("for iPhone"), or competitor names. It must be unique on the App Store.',
        how_to_do_it: `Good app names:
- Are unique and memorable
- Hint at what the app does (if possible)
- Are easy to spell and pronounce
- Don't include generic category words like "app" or "tool"

What to avoid:
- "Free" or any pricing info
- "iOS", "iPhone", "iPad" (Apple rejects these)
- Competitor names ("Better than [OtherApp]")
- Trademarked terms you don't own
- ALL CAPS (looks spammy)
- Random keywords stuffed together

Examples:
- Good: "Vero" or "Pocket Budget"
- Bad: "Free Budget Tracker Pro iOS"

Check availability:
- Search the App Store for your desired name
- Search USPTO.gov for trademark conflicts`,
        estimated_time: '10-30 minutes (including brainstorming)',
        is_required: true,
        order: 10,
    },
    {
        id: 'write-subtitle',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Write Your Subtitle (30 characters max)',
        description: 'The subtitle appears right below your app name in search results. It\'s a great place to quickly explain what your app does or highlight a key benefit.',
        why_it_matters: 'The subtitle significantly impacts your App Store search ranking and helps users understand your app at a glance. It\'s valuable real estate - use it wisely for keywords or your value proposition.',
        how_to_do_it: `Good subtitles:
- Expand on what the app does
- Include a relevant keyword naturally
- Highlight your main benefit

Examples:
- "Your money, made simple" (benefit-focused)
- "Track expenses & save more" (feature-focused)
- "AI-powered writing assistant" (technology-focused)

What to avoid:
- Repeating your app name
- Generic phrases like "The best app"
- Pricing information
- Platform references

Pro tip: Include one important keyword that didn't fit in your app name. This helps with search rankings.`,
        estimated_time: '10 minutes',
        is_required: false,
        order: 11,
    },
    {
        id: 'write-description',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Write Your App Description (4,000 characters max)',
        description: 'This is your sales pitch to potential users. It appears on your App Store page and is your chance to convince people to download your app.',
        why_it_matters: 'A good description converts browsers into downloaders. Only the first 2-3 lines show before "More..." so lead with your best content. Note: Apple doesn\'t use description text for search ranking, but users definitely read it.',
        how_to_do_it: `Structure your description:
1. First 2-3 lines: Your app's core value (this is what shows before "More...")
2. Key features: Bullet points work great
3. Social proof: Reviews, awards, press mentions if you have them
4. Call to action: Encourage the download

Template:
"""
[One powerful sentence about what your app does and who it's for]

KEY FEATURES:
- [Feature 1 with benefit]
- [Feature 2 with benefit]
- [Feature 3 with benefit]

[Optional: testimonials, awards, or press mentions]

[Optional: subscription info if applicable]

Download now and [benefit statement]!
"""

What to avoid:
- Mentioning competitors by name
- Claiming to be "#1" without proof
- Listing features without benefits
- Keyword stuffing (doesn't help SEO here anyway)
- Mentioning prices (they can change)`,
        estimated_time: '30-60 minutes',
        is_required: true,
        order: 12,
    },
    {
        id: 'add-keywords',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Add Keywords (100 characters max)',
        description: 'Keywords are a comma-separated list of search terms that help users find your app. This field is HIDDEN from users but heavily used by the App Store search algorithm.',
        why_it_matters: 'This is the #1 factor for App Store search ranking. Unlike your description (which Apple doesn\'t use for search), keywords directly impact whether your app appears in search results. Every character counts.',
        how_to_do_it: `Keywords best practices:
1. Use all 100 characters (don't waste space!)
2. Separate with commas, no spaces after commas
3. Use singular forms (Apple searches plurals automatically)
4. Don't repeat words from your app name or subtitle (they're already indexed)
5. Don't include "app" or your category name
6. Think about misspellings users might make

Example format:
budget,spending,expense,tracker,money,finance,bank,cash,bills,savings,planner

Research keywords:
- Think about how YOU would search for your app
- Check competitor apps' keywords (tools like AppFollow can help)
- Consider related terms (e.g., "journal" for a notes app)

What to avoid:
- Competitor names (Apple rejects this)
- Trademarked terms
- Irrelevant popular terms
- Spaces after commas (wastes characters)`,
        helpful_link: 'https://developer.apple.com/app-store/search/',
        estimated_time: '30-45 minutes',
        is_required: true,
        order: 13,
    },
    {
        id: 'select-category',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Select Your App Category',
        description: 'You must choose a primary category (required) and can choose a secondary category (optional). Categories determine where your app appears in the App Store browse section.',
        why_it_matters: 'Your category affects who discovers your app through browsing. Choose incorrectly and you\'ll either get lost in a crowded category or placed somewhere users won\'t look for you. Some categories have special requirements.',
        how_to_do_it: `Choose your primary category based on your app's main function:
- Finance: Banking, budgeting, investing, payment apps
- Health & Fitness: Workout trackers, meditation, health monitoring
- Productivity: Task managers, note-taking, document tools
- Utilities: Calculators, converters, file managers
- Games: Any kind of game
- Social Networking: Chat, social media, community apps

Special category requirements:
- Kids Category: Extra privacy requirements, no external links
- Medical: May need regulatory approval
- Finance: May need compliance disclosures
- Games: Need age rating considerations

Secondary category tips:
- Optional but recommended
- Choose something complementary (e.g., Finance primary, Lifestyle secondary)
- Helps you appear in more browse sections`,
        estimated_time: '5 minutes',
        is_required: true,
        order: 14,
    },
    {
        id: 'set-age-rating',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Complete the Age Rating Questionnaire',
        description: 'Apple asks you a series of yes/no questions about your app\'s content to determine the age rating. This isn\'t just a dropdown - you answer questions about violence, mature themes, etc.',
        why_it_matters: 'Misrating your app (especially rating it too young for its content) will cause rejection. Being honest protects you and ensures your app reaches the right audience. Some categories like Kids require specific age ratings.',
        how_to_do_it: `The questionnaire covers:
- Violence (cartoon, realistic, graphic)
- Sexual content or nudity
- Profanity or crude humor
- Drug, alcohol, or tobacco references
- Horror or fear themes
- Gambling (simulated or real)
- Medical/treatment information
- User-generated content

Age ratings explained:
- 4+: Suitable for children (no objectionable content)
- 9+: Mild/infrequent cartoon violence
- 12+: Infrequent mature themes, mild violence
- 17+: Frequent intense violence, mature themes

Tips:
- Answer honestly - Apple does review your content
- When in doubt, rate higher (safer)
- User-generated content usually requires 12+ minimum
- If your app has a web view showing external content, consider that`,
        estimated_time: '5-10 minutes',
        is_required: true,
        order: 15,
    },

    // --- Screenshots & Media ---
    {
        id: 'prepare-screenshots',
        phase: 'pre_submission',
        category: 'screenshots_media',
        title: 'Create App Store Screenshots',
        description: 'Screenshots are often the deciding factor in whether someone downloads your app. You need screenshots for each device size you support, with specific pixel dimensions.',
        why_it_matters: 'Screenshots are your app\'s storefront window. Users scroll through them before reading anything else. Great screenshots can double or triple your conversion rate. You must provide screenshots for the largest device sizes.',
        how_to_do_it: `Required screenshot sizes (in pixels):
- iPhone 6.7" (required): 1290 x 2796 px
- iPhone 6.5" (optional but recommended): 1242 x 2688 px
- iPhone 5.5" (for older devices): 1242 x 2208 px
- iPad Pro 12.9": 2048 x 2732 px (if you support iPad)

Screenshot requirements:
- Minimum 1, maximum 10 per device size
- PNG or JPEG format
- No alpha transparency (no see-through areas)
- Can be portrait or landscape (but be consistent)

What makes great screenshots:
1. Show your app in action (not just splash screens)
2. Highlight key features with text overlays
3. Use real, compelling content (not "Lorem ipsum")
4. Tell a story - each screenshot should build on the last
5. Put your best screenshot first

Tools to create screenshots:
- Free: Canva, Figma
- Paid: AppLaunchpad, LaunchMatic, Rotato
- DIY: Screenshots + Keynote/PowerPoint for text overlays

Common rejections:
- Wrong dimensions (must be exact)
- Status bar showing wrong info
- Placeholder text visible
- Device frames that don't match the screenshot size`,
        helpful_link: 'https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications',
        estimated_time: '2-4 hours for professional screenshots',
        is_required: true,
        order: 16,
    },
    {
        id: 'create-app-icon',
        phase: 'pre_submission',
        category: 'screenshots_media',
        title: 'Create Your App Icon',
        description: 'Your app icon appears everywhere - the App Store, home screens, Settings. You need a 1024x1024 pixel PNG for the App Store, plus various smaller sizes for the app itself.',
        why_it_matters: 'Your icon is your app\'s face. It needs to be recognizable at 60x60 pixels while also looking great at 1024x1024. A bad icon makes your app look unprofessional and can kill downloads.',
        how_to_do_it: `For App Store Connect:
- 1024 x 1024 pixels
- PNG format
- No transparency (no alpha channel)
- No rounded corners (Apple adds those automatically)
- sRGB color space

Design tips:
- Keep it simple - it needs to read at tiny sizes
- Use bold colors that stand out
- Avoid text (unreadable at small sizes)
- Don't use photographs
- Make it unique and memorable
- Test at actual sizes (60px, 120px, 180px)

Common mistakes:
- Icon looks great big, unrecognizable small
- Too much detail that becomes muddy
- Colors that blend with common wallpapers
- Copying another app's icon style

For your Xcode project:
- You need multiple sizes in your asset catalog
- Xcode 14+ can auto-generate from a single 1024px icon
- Check Assets.xcassets > AppIcon`,
        helpful_link: 'https://developer.apple.com/design/human-interface-guidelines/app-icons',
        estimated_time: '1-3 hours (or hire a designer)',
        is_required: true,
        order: 17,
    },
    {
        id: 'create-preview-video',
        phase: 'pre_submission',
        category: 'screenshots_media',
        title: 'Create an App Preview Video (Optional but Recommended)',
        description: 'App previews are short videos (15-30 seconds) that autoplay in search results and on your app page. They can showcase your app\'s features in action.',
        why_it_matters: 'Videos can significantly boost conversion rates because they show your app in motion. Users get a feel for the experience before downloading. However, a bad video is worse than no video.',
        how_to_do_it: `Video specifications:
- Length: 15-30 seconds
- Format: M4V, MP4, or MOV
- Resolution: Must match device (e.g., 1080 x 1920 for iPhone)
- Frame rate: 30 fps
- Audio: Optional but recommended

Content best practices:
- Start with your best feature (first 3 seconds are crucial)
- Show the app being used, not just talking about it
- Use text overlays to highlight features
- Keep it fast-paced - no long pauses
- End with your logo/name

How to record:
1. Use a real device (not simulator - users can tell)
2. QuickTime: Connect iPhone via USB > File > New Movie Recording > Select your iPhone
3. Or use the built-in screen recorder on iOS

Editing tools:
- Free: iMovie, CapCut
- Pro: Final Cut Pro, Adobe Premiere

Common mistakes:
- Too long and boring
- Starting with a logo animation (boring!)
- Showing features that aren't in the current version
- Poor audio quality`,
        helpful_link: 'https://developer.apple.com/app-store/app-previews/',
        estimated_time: '4-8 hours for a quality video',
        is_required: false,
        order: 18,
    },

    // --- Legal & Privacy ---
    {
        id: 'create-privacy-policy',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Create a Privacy Policy',
        description: 'A privacy policy is a legal document explaining what user data you collect, how you use it, and how you protect it. Apple requires this for ALL apps, even if you collect no data.',
        why_it_matters: 'Apple will reject your app without a valid, accessible privacy policy. Many countries (GDPR in EU, CCPA in California) also legally require it. This protects both your users and you.',
        how_to_do_it: `What your privacy policy needs:
1. What data you collect (even if "none")
2. How you use that data
3. Who you share it with (third parties, analytics, etc.)
4. How users can request data deletion
5. How to contact you about privacy concerns
6. When the policy was last updated

Where to host it:
- Your app's website
- A free hosting service (GitHub Pages, Notion public page)
- Privacy policy generator sites (but customize it!)

Free generators:
- app-privacy-policy-generator.firebaseapp.com
- freeprivacypolicy.com
- termly.io (freemium)

Important: Don't just copy a generic template. Customize it for YOUR app:
- If you use analytics (even Apple's), mention it
- If you use third-party SDKs (Firebase, etc.), list them
- If you collect ANY user data, explain why

The URL must:
- Be HTTPS (not HTTP)
- Be publicly accessible (no login required)
- Return a 200 status code
- Actually contain a privacy policy`,
        helpful_link: 'https://developer.apple.com/app-store/app-privacy-details/',
        estimated_time: '30-60 minutes',
        is_required: true,
        order: 19,
    },
    {
        id: 'create-support-url',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Set Up a Support URL',
        description: 'Apple requires a support URL where users can get help with your app. This can be a webpage, FAQ, or even a simple contact form.',
        why_it_matters: 'Users need a way to reach you if something goes wrong. Apple will reject apps without a working support URL. This also reduces negative reviews - users will contact you instead of leaving 1-star reviews.',
        how_to_do_it: `Your support page should include:
1. How to contact you (email at minimum)
2. FAQ for common issues
3. Your response time expectations

Simple options:
- A page on your app's website
- A Google Form for support requests
- A simple mailto: link page (minimum viable)
- A Discord/Slack community link

What to avoid:
- Social media as your only contact method
- A page that requires login to view
- Broken or placeholder pages

Pro tip: Set up a dedicated email like support@yourapp.com. Creates a better impression than personal Gmail.`,
        estimated_time: '15-30 minutes',
        is_required: true,
        order: 20,
    },
    {
        id: 'setup-privacy-manifest',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Create Privacy Nutrition Labels',
        description: 'Apple\'s privacy "nutrition labels" appear on your App Store page showing what data your app collects. You fill this out in App Store Connect based on what your app actually does.',
        why_it_matters: 'This is mandatory since late 2020. Apple displays this prominently on your App Store page. Users check this before downloading. Being dishonest here can get your app removed.',
        how_to_do_it: `In App Store Connect, you'll answer questions about:

Data types Apple asks about:
- Contact Info (name, email, phone)
- Health & Fitness
- Financial Info
- Location
- Contacts
- User Content
- Browsing History
- Search History
- Identifiers (User ID, Device ID)
- Usage Data
- Diagnostics

For each data type, you specify:
1. Is it collected?
2. Is it linked to user identity?
3. Is it used for tracking?
4. Purpose (app functionality, analytics, advertising, etc.)

Tips:
- Be thorough - include third-party SDKs' data collection
- Firebase, analytics tools, ad networks all collect data
- Check your SDK documentation
- When in doubt, disclose it

Common mistake: Forgetting that third-party SDKs collect data on your behalf. You're responsible for disclosing ALL data collection.`,
        helpful_link: 'https://developer.apple.com/app-store/app-privacy-details/',
        estimated_time: '20-30 minutes',
        is_required: true,
        order: 21,
    },
    {
        id: 'add-privacy-manifest-file',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Add PrivacyInfo.xcprivacy File (If Required)',
        description: 'If your app uses certain "required reason APIs" (like UserDefaults, file timestamps, or disk space), you need a PrivacyInfo.xcprivacy file in your Xcode project explaining why.',
        why_it_matters: 'Starting in 2024, Apple requires this file if you use specific APIs. Without it, your app will be rejected. This is different from the App Store Connect privacy questions - this is a file IN your app.',
        how_to_do_it: `Check if you need it:
Your app needs a privacy manifest if it uses:
- UserDefaults (most apps do!)
- File timestamp APIs
- System boot time APIs
- Disk space APIs
- Active keyboards list

Creating the file:
1. In Xcode, File > New > File
2. Search for "Privacy"
3. Select "App Privacy" file type
4. Name it "PrivacyInfo.xcprivacy"
5. Add it to your main app target

What to put in it:
- List each "required reason API" category you use
- Select the Apple-approved reason codes for your usage
- Be accurate - Apple may verify this

Example: If you use UserDefaults to save user preferences:
- Category: NSPrivacyAccessedAPICategoryUserDefaults
- Reason: CA92.1 (access info from same app)

Common reason codes:
- UserDefaults: CA92.1 (for your own app's preferences)
- File timestamps: DDA9.1 (for displaying to user)
- Disk space: 85F4.1 (for checking available space)`,
        helpful_link: 'https://developer.apple.com/documentation/bundleresources/privacy_manifest_files',
        estimated_time: '15-30 minutes',
        is_required: false, // Only required if using those APIs
        category_specific: ['Finance', 'Health & Fitness', 'Productivity'],
        order: 22,
    },

    // --- Testing ---
    {
        id: 'setup-testflight',
        phase: 'pre_submission',
        category: 'testing',
        title: 'Set Up TestFlight Beta Testing',
        description: 'TestFlight is Apple\'s official beta testing platform. It lets you distribute your app to testers before App Store release. Testers install via the TestFlight app.',
        why_it_matters: 'Testing with real users catches bugs you\'d never find yourself. Apple requires apps to be functional - a buggy app will be rejected. TestFlight also helps you validate your App Store screenshots and description.',
        how_to_do_it: `Internal Testing (up to 100 people):
1. Upload a build to App Store Connect
2. Go to TestFlight tab
3. Add testers by Apple ID email
4. They install TestFlight app and accept invite

External Testing (up to 10,000 people):
1. Create a "Group" in TestFlight
2. Submit your build for Beta App Review (usually 24-48 hours)
3. Once approved, add testers or share a public link
4. Anyone with the link can join (up to your limit)

Tips:
- Start with internal testing (no review needed)
- Test on multiple device types and iOS versions
- Actually READ crash reports and feedback
- Fix critical bugs before App Store submission

TestFlight features:
- Automatic crash reports
- User feedback with screenshots
- Build expiration (90 days)
- Easy version management`,
        helpful_link: 'https://developer.apple.com/testflight/',
        estimated_time: '30 minutes to set up, ongoing for testing',
        is_required: false,
        order: 23,
    },
    {
        id: 'test-on-devices',
        phase: 'pre_submission',
        category: 'testing',
        title: 'Test on Real Devices',
        description: 'The simulator is great for development, but it doesn\'t catch everything. Test on actual iPhones and iPads before submitting.',
        why_it_matters: 'Apps that crash on real devices get rejected. The simulator doesn\'t perfectly replicate memory constraints, camera functionality, push notifications, and other hardware features.',
        how_to_do_it: `What to test:
- All main user flows work
- App doesn't crash on launch
- All buttons/gestures respond correctly
- Performance is acceptable (no major lag)
- Network errors are handled gracefully
- App works offline (if applicable)
- Dark mode looks right
- Different text sizes (accessibility)
- Both orientations (if supported)

Devices to test:
- At least one newer iPhone (iPhone 12+)
- At least one older supported iPhone
- iPad (if you support iPad)
- The smallest screen size you support

Common issues found only on device:
- Camera/photo picker crashes
- Push notifications not working
- Memory issues (app killed by system)
- Slow performance on older devices
- Keyboard covering input fields`,
        estimated_time: '2-4 hours of thorough testing',
        is_required: true,
        order: 24,
    },

    // --- Final Submission ---
    {
        id: 'final-review-metadata',
        phase: 'pre_submission',
        category: 'submission',
        title: 'Final Review: Check All Metadata',
        description: 'Before submitting, do a final check of everything in App Store Connect. Many rejections come from simple oversights that are easy to fix.',
        why_it_matters: 'A rejection delays your launch by days or weeks. Spending 30 minutes reviewing everything can save you significant time. Many rejections are for obvious mistakes.',
        how_to_do_it: `Checklist:
[ ] App name: No pricing, no platform names, unique
[ ] Subtitle: Complements name, not redundant
[ ] Description: First line is compelling, no competitor names
[ ] Keywords: All 100 characters used, no spaces after commas
[ ] Screenshots: Correct dimensions, show real app, no placeholders
[ ] Privacy policy URL: Works, HTTPS, accessible without login
[ ] Support URL: Works, has actual contact information
[ ] Category: Appropriate for your app
[ ] Age rating: Accurate for content
[ ] Version number: Matches your build
[ ] What's New: Filled in (even for v1.0 - just describe the app)
[ ] App review notes: Include any needed test accounts

Read everything out loud:
- Catches typos you'd miss silently
- Ensures it flows naturally
- Verify nothing sounds like placeholder text`,
        estimated_time: '30 minutes',
        is_required: true,
        order: 25,
    },
    {
        id: 'add-review-notes',
        phase: 'pre_submission',
        category: 'submission',
        title: 'Write App Review Notes',
        description: 'Review notes are private instructions for Apple\'s review team. Use them to provide login credentials, explain complex features, or give context that isn\'t obvious.',
        why_it_matters: 'Reviewers only have minutes to test your app. If they can\'t figure out how to use a feature, they\'ll reject it. Good notes help them understand your app quickly.',
        how_to_do_it: `When to include notes:
- Your app requires a login → Provide a test account!
- Features need specific setup → Explain how to access them
- App uses location → Tell them where to set the simulator location
- App connects to hardware → Explain how to test without it
- Subscription features → Provide a way to test premium features

Format example:
"""
Demo Account:
Email: demo@yourapp.com
Password: TestPassword123

To test the budget feature:
1. Log in with the demo account
2. Tap the + button
3. Add a transaction

Note: The AI chat feature requires an active internet connection.
"""

Tips:
- Be concise but complete
- Update notes with each submission
- Mention anything that might confuse a reviewer
- Be friendly and professional`,
        estimated_time: '10-20 minutes',
        is_required: false,
        order: 26,
    },
    {
        id: 'submit-for-review',
        phase: 'pre_submission',
        category: 'submission',
        title: 'Submit for Review',
        description: 'The moment of truth! After completing all the above, you\'re ready to submit your app to Apple for review.',
        why_it_matters: 'This kicks off the review process. Once submitted, you can\'t make changes until Apple responds. Make sure everything is truly ready before clicking that button.',
        how_to_do_it: `Final steps:
1. In App Store Connect, go to your app
2. Select the version you're submitting
3. Scroll down and check "Automatically release this version" (or manual if you prefer)
4. Click "Add for Review"
5. Answer the final questions:
   - Export compliance (encryption)
   - Content rights
   - Advertising identifier (IDFA)
6. Click "Submit to App Review"

What happens next:
- Status changes to "Waiting for Review"
- You'll get an email confirming submission
- Wait for review (average 24-48 hours, can be longer)
- You'll get an email with the result

If you need to make changes:
- You can "Remove from Review" before review starts
- Once review starts, you must wait for the result
- If rejected, you can resubmit with fixes`,
        estimated_time: '10 minutes',
        is_required: true,
        order: 27,
    },

    // ============================================
    // PHASE 2: DURING REVIEW
    // ============================================

    {
        id: 'understand-review-process',
        phase: 'during_review',
        category: 'review_process',
        title: 'Understand What Happens During Review',
        description: 'Apple has a team of human reviewers who test every app submission. Understanding the process helps you know what to expect and reduces anxiety.',
        why_it_matters: 'The waiting can be stressful, especially for your first app. Knowing what\'s happening helps you plan and respond appropriately if there are issues.',
        how_to_do_it: `What reviewers check:
1. App launches and doesn't crash
2. All described features work
3. No placeholder or test content
4. No policy violations (content, privacy, payments)
5. All links work (privacy policy, support)
6. Screenshots match the app
7. Age rating is appropriate

How long it takes:
- Average: 24-48 hours
- First app: Sometimes longer
- Holiday periods: Can be slower
- Complex apps: May take longer

Status meanings:
- "Waiting for Review": In queue, not yet started
- "In Review": A reviewer is actively testing your app
- "Pending Developer Release": Approved! Waiting for you to release
- "Ready for Sale": Live on the App Store
- "Rejected": Issues found (you'll get details)

Tip: There's nothing you can do to speed it up. Don't contact Apple asking for updates.`,
        estimated_time: 'N/A - information only',
        is_required: true,
        order: 28,
    },
    {
        id: 'monitor-status',
        phase: 'during_review',
        category: 'review_process',
        title: 'Monitor Your App Status',
        description: 'Keep an eye on App Store Connect for status updates. Apple will also email you when the status changes.',
        why_it_matters: 'You want to know immediately if there\'s a rejection so you can fix it quickly. The faster you respond, the sooner you can get approved.',
        how_to_do_it: `Where to check:
- App Store Connect > Your App > Activity
- iOS App Store Connect app (push notifications!)
- Email (make sure Apple emails aren't going to spam)

Status timeline for typical approval:
Day 1: Submit → "Waiting for Review"
Day 1-2: → "In Review"
Day 2-3: → "Ready for Sale" or "Rejected"

If it's taking longer:
- Holiday periods (Dec, Jan) are slower
- First-time submissions may take longer
- Apps with subscriptions/payments get extra scrutiny
- Controversial content categories take longer

Don't:
- Submit multiple support tickets asking for updates
- Email Apple daily
- Cancel and resubmit (resets your place in line!)`,
        estimated_time: 'Check daily during review',
        is_required: true,
        order: 29,
    },
    {
        id: 'prepare-for-rejection',
        phase: 'during_review',
        category: 'review_process',
        title: 'Prepare for Potential Rejection (Don\'t Panic!)',
        description: 'Rejection is common, especially for first-time developers. It\'s not the end of the world - it\'s a normal part of the process. Have a plan ready.',
        why_it_matters: 'About 40% of first submissions get rejected. Being mentally and practically prepared helps you respond quickly and get approved faster.',
        how_to_do_it: `Most common rejection reasons:
1. Guideline 2.1 - App crashes or has bugs
2. Guideline 2.3 - Metadata issues (screenshots don't match, etc.)
3. Guideline 4.2 - App lacks features/functionality
4. Guideline 5.1.1 - Privacy issues (missing policy, permissions)
5. Guideline 2.1 - Placeholder content left in

If you get rejected:
1. READ the rejection reason carefully
2. Check the Resolution Center in App Store Connect
3. Look at any screenshots Apple attached
4. Understand EXACTLY what the issue is
5. Fix ONLY what they mentioned (don't change other stuff)
6. Resubmit with notes explaining your fix

Response timeline:
- Simple fixes: Resubmit same day
- Code changes: 1-2 days
- Major issues: Take time to do it right

Remember: Rejection is feedback, not failure. Most successful apps were rejected at least once.`,
        estimated_time: 'Be ready to spend 1-4 hours fixing issues',
        is_required: true,
        order: 30,
    },
    {
        id: 'handle-rejection',
        phase: 'during_review',
        category: 'communication',
        title: 'How to Handle a Rejection',
        description: 'If your app is rejected, here\'s exactly how to respond. The key is to be calm, professional, and thorough.',
        why_it_matters: 'Your response determines how quickly you get approved. A good response addressing all issues can get you approved in 24 hours. A poor response leads to more back-and-forth.',
        how_to_do_it: `Step 1: Understand the rejection
- Go to App Store Connect > Your App > Resolution Center
- Read Apple's message carefully (sometimes multiple times)
- They often attach screenshots showing the issue
- The guideline number tells you exactly what rule was violated

Step 2: Fix the issue
- Address EXACTLY what they mentioned
- Don't make unrelated changes (this can trigger new issues)
- Test your fix thoroughly

Step 3: Reply in Resolution Center
- Explain what you fixed and how
- Be concise but complete
- Be professional (even if you disagree)
- Include screenshots if helpful

Step 4: Resubmit
- Make sure to select the SAME version number
- Increment the build number
- Include notes for the reviewer explaining your fix

Example response:
"""
Thank you for the feedback. I've addressed the issue as follows:

Issue: Screenshot 3 showed a feature not in the current build.
Fix: I've replaced screenshot 3 with an accurate representation of the current Budgets screen.

The new build (1.0.2) includes no code changes, only corrected screenshots.
"""

If you think the rejection is wrong:
- You can appeal via Resolution Center
- Be respectful and provide clear evidence
- Include screenshots or documentation supporting your case`,
        estimated_time: '1-4 hours to fix and resubmit',
        is_required: false,
        order: 31,
    },
    {
        id: 'use-resolution-center',
        phase: 'during_review',
        category: 'communication',
        title: 'Using the Resolution Center',
        description: 'The Resolution Center is where you communicate with App Review. It\'s a messaging system in App Store Connect where you can respond to rejections or ask for clarification.',
        why_it_matters: 'This is your only direct communication channel with reviewers. Using it correctly speeds up the resolution process. Don\'t use other channels (email, phone) for review issues.',
        how_to_do_it: `Accessing Resolution Center:
1. Go to App Store Connect
2. Select your app
3. Click on the version that was reviewed
4. Look for "Resolution Center" in the sidebar

What you can do:
- Reply to reviewer comments
- Attach screenshots or videos
- Request a call with App Review (for complex issues)
- Submit appeal if you believe rejection was incorrect

Best practices:
- Respond promptly (within 24 hours if possible)
- Be specific about what you changed
- One message per response (don't send multiple)
- Attach evidence when possible

When to request a call:
- The rejection seems like a misunderstanding
- You've been rejected multiple times for the same issue
- The issue is complex and needs discussion
- NOT for rushing the process`,
        helpful_link: 'https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages',
        estimated_time: '10-30 minutes',
        is_required: false,
        order: 32,
    },

    // ============================================
    // PHASE 3: POST-APPROVAL
    // ============================================

    {
        id: 'release-your-app',
        phase: 'post_approval',
        category: 'launch_marketing',
        title: 'Release Your App',
        description: 'Congratulations! Your app is approved. Now you decide when to make it live on the App Store.',
        why_it_matters: 'Timing your release can impact your launch success. You might want to coordinate with marketing, a specific date, or just release immediately.',
        how_to_do_it: `Release options:
1. Automatic Release: Goes live as soon as approved
2. Manual Release: You click a button when ready
3. Scheduled Release: Set a specific date/time

For Manual Release:
1. Go to App Store Connect
2. Select your app and version
3. Click "Release This Version"
4. Your app goes live within minutes to a few hours

Best practices:
- Don't release on Fridays (if issues arise, wait until Monday)
- Consider time zones (release when your target audience is awake)
- Have your marketing ready before releasing
- Test the App Store listing immediately after release

After release:
- Your app may take a few hours to appear in search
- International availability takes up to 24 hours
- Tell everyone! (but have support ready for feedback)`,
        estimated_time: '5 minutes for the release, timing is strategic',
        is_required: true,
        order: 33,
    },
    {
        id: 'announce-launch',
        phase: 'post_approval',
        category: 'launch_marketing',
        title: 'Announce Your Launch',
        description: 'Your app is live! Now tell the world. A good launch announcement can significantly boost initial downloads.',
        why_it_matters: 'Initial momentum matters for App Store ranking. More downloads early = better visibility = more organic downloads. First impressions matter.',
        how_to_do_it: `Launch announcement checklist:
1. Social media posts (have these written in advance!)
2. Email your waiting list (if you have one)
3. Post in relevant communities (Reddit, forums, etc.)
4. Reach out to tech blogs/journalists
5. Tell friends and family (early reviews help!)

Social media tips:
- Include App Store link
- Use a compelling screenshot or video
- Keep it short and exciting
- Post at peak times for your audience

Where to post:
- Twitter/X
- LinkedIn (if B2B or professional app)
- Reddit (r/iOSProgramming, relevant topic subreddits)
- Product Hunt (register in advance!)
- Hacker News (if technical audience)
- Facebook groups (if relevant)

What to include:
- App Store link
- What problem it solves
- A screenshot or video
- Launch day special (if any)

Template:
"""
[App Name] is live on the App Store!

[One line about what it does]

After [X months] of building, I'm excited to share this with you.

Download free: [link]

[Screenshot/Video]
"""`,
        estimated_time: '2-4 hours for full launch marketing',
        is_required: false,
        order: 34,
    },
    {
        id: 'ask-for-reviews',
        phase: 'post_approval',
        category: 'launch_marketing',
        title: 'Get Your First Reviews',
        description: 'App Store reviews significantly impact downloads. Getting positive reviews early establishes credibility.',
        why_it_matters: 'Apps with no reviews look risky to potential users. A few positive reviews provide social proof and improve your conversion rate. Reviews also affect App Store search ranking.',
        how_to_do_it: `Getting early reviews:
1. Ask friends and family who downloaded to leave a review
2. Use Apple's SKStoreReviewController (prompts users in-app)
3. Follow up with early users via email (if you have their contact)
4. Respond to every early review (shows you care)

In-app review prompts:
- Use Apple's built-in prompt (StoreKit)
- Don't show on first launch (let them use the app first)
- Show after a positive experience (completed a task, etc.)
- Don't spam - Apple limits to 3 prompts per year per user
- NEVER ask users to give 5 stars (this is against guidelines)

Timing tips:
- Ask after user completes something successfully
- Don't ask during frustrating moments
- Don't ask too early (before they've experienced value)

Responding to reviews:
- Respond to ALL reviews, especially negative ones
- Be professional and helpful
- For negative reviews, offer to help via your support channel
- Updates can change "1 star - doesn't work" to "5 stars - fixed!"`,
        helpful_link: 'https://developer.apple.com/documentation/storekit/skstorereviewcontroller',
        estimated_time: 'Ongoing',
        is_required: false,
        order: 35,
    },
    {
        id: 'monitor-analytics',
        phase: 'post_approval',
        category: 'optimization',
        title: 'Set Up and Monitor App Analytics',
        description: 'App Store Connect provides free analytics about downloads, user engagement, and more. Understanding these helps you improve.',
        why_it_matters: 'Data tells you what\'s working and what isn\'t. You can see where users come from, how many download, and how your App Store listing performs.',
        how_to_do_it: `In App Store Connect > Analytics, you'll find:

Downloads & Re-downloads:
- How many people downloaded your app
- First-time vs returning users
- Trend over time

Impressions & Product Page Views:
- How many saw your app in search/browse
- How many clicked to your page
- Conversion rate (views → downloads)

Sales & Proceeds:
- Revenue from purchases
- Proceeds after Apple's cut
- By region/country

App Analytics (requires SDK integration):
- Sessions (how often app is opened)
- Active devices
- Retention rate
- Crash data

Key metrics to watch:
- Conversion rate (improve your screenshots/description if low)
- Retention (improve app experience if low)
- Crash rate (prioritize stability fixes)
- Review sentiment (address common complaints)`,
        helpful_link: 'https://developer.apple.com/app-store-connect/analytics/',
        estimated_time: '15 minutes to set up, check weekly',
        is_required: false,
        order: 36,
    },
    {
        id: 'respond-to-reviews',
        phase: 'post_approval',
        category: 'maintenance',
        title: 'Respond to User Reviews',
        description: 'You can publicly respond to reviews in App Store Connect. This shows users you care and can turn negative experiences into positive ones.',
        why_it_matters: 'Responses show potential users that there\'s a human behind the app who cares. A good response to a negative review can make that user update their rating, and shows other users you\'re responsive.',
        how_to_do_it: `How to respond:
1. App Store Connect > Your App > Ratings and Reviews
2. Click on a review
3. Type your response
4. Submit (visible publicly within 24 hours)

For positive reviews:
- Thank them genuinely
- Keep it short
- Mention you're working on improvements

For negative reviews:
- Don't be defensive
- Acknowledge their frustration
- Offer a solution or explain the issue
- Provide your support email for follow-up
- If you fix the issue, mention it so they can update their review

Templates:
Positive: "Thank you so much for the kind words! We're working hard to make [App] even better."

Negative (bug): "Sorry you experienced this issue. We've identified the problem and it will be fixed in our next update (coming this week). Please reach out to support@yourapp.com if you need immediate help."

Negative (feature request): "Thanks for the feedback! This feature is on our roadmap. In the meantime, you might try [alternative]. We'd love to hear more at support@yourapp.com."`,
        estimated_time: 'Check reviews 2-3 times per week, 5-10 minutes each',
        is_required: false,
        order: 37,
    },
    {
        id: 'monitor-crashes',
        phase: 'post_approval',
        category: 'maintenance',
        title: 'Monitor Crash Reports',
        description: 'Apple collects crash reports from users who have opted in to share diagnostics. These help you find and fix issues you never saw in testing.',
        why_it_matters: 'Real users on real devices in real conditions will find bugs you didn\'t. Addressing crashes quickly improves reviews and retention. High crash rates can lead to removal from the App Store.',
        how_to_do_it: `Where to find crashes:
1. App Store Connect > Your App > Analytics > Metrics > Crashes
2. Xcode > Window > Organizer > Crashes

Understanding crash reports:
- Stack trace: Shows exactly where the crash happened
- Device/iOS version: What hardware/software was affected
- Frequency: How many users were impacted

Prioritizing fixes:
1. High frequency + recent iOS = Fix immediately
2. High frequency + older iOS = Important
3. Low frequency + any iOS = Check if reproducible
4. Edge case crashes = Lower priority

Third-party crash reporting (recommended):
- Firebase Crashlytics (free, popular)
- Sentry (more detailed, paid)
- Bugsnag (team features)

These give you more detail than Apple's reports and can send alerts when new crashes occur.

After fixing:
- Mention in release notes that crashes were fixed
- Thank users who reported issues`,
        helpful_link: 'https://developer.apple.com/documentation/xcode/diagnosing-issues-using-crash-reports-and-device-logs',
        estimated_time: 'Check weekly, fix crashes as needed',
        is_required: true,
        order: 38,
    },
    {
        id: 'plan-first-update',
        phase: 'post_approval',
        category: 'maintenance',
        title: 'Plan Your First Update',
        description: 'Your launch is just the beginning. Planning your first update shows users the app is actively maintained and gives you a chance to fix launch issues.',
        why_it_matters: 'Users are more likely to keep apps that are actively updated. Your first update can address launch feedback, fix bugs, and improve on areas you rushed.',
        how_to_do_it: `Gather feedback first:
- Read all reviews (especially negative ones)
- Check crash reports
- Ask early users what's missing
- Look at analytics (where do users drop off?)

First update priorities:
1. Critical bugs and crashes (fix these first!)
2. Commonly requested features
3. Performance improvements
4. Quality of life improvements

Update timeline:
- 1-2 weeks after launch: Bug fix update (if needed)
- 1 month after launch: Minor improvements update
- Ongoing: Regular updates every 4-6 weeks

What to include in update notes:
- Be specific about what changed
- Thank users for feedback
- Mention fixed bugs
- Highlight new features

Example update notes:
"""
Thanks for all the feedback since launch!

New:
- Dark mode support
- Export to CSV

Fixed:
- Crash when adding transactions quickly
- Charts not displaying correctly on older iPhones

We're listening! Email us at support@yourapp.com with your ideas.
"""`,
        estimated_time: 'Ongoing development',
        is_required: false,
        order: 39,
    },
    {
        id: 'app-store-optimization',
        phase: 'post_approval',
        category: 'optimization',
        title: 'Optimize Your App Store Listing (ASO)',
        description: 'App Store Optimization is like SEO but for the App Store. Small improvements to your listing can significantly increase downloads.',
        why_it_matters: 'Most downloads come from App Store search. Improving your visibility and conversion rate is the cheapest way to get more users. This is an ongoing process.',
        how_to_do_it: `Key ASO factors:
1. Keywords: Update based on performance data
2. Title: Most important keyword factor
3. Screenshots: Huge impact on conversion
4. Reviews: More reviews = more trust = more downloads
5. Icon: First thing people see

Optimizing keywords:
- Use App Store Connect's App Analytics to see search terms
- Track which keywords bring impressions vs downloads
- Test new keywords with each update
- Focus on medium-competition keywords (not too broad, not too narrow)

Optimizing screenshots:
- A/B test different versions (tools like SplitMetrics)
- Put your strongest screenshot first
- Update seasonally if relevant
- Show new features

Tracking success:
- Monitor impressions, taps, and downloads
- Compare week-over-week
- Note what changed when metrics change

Tools (optional):
- AppFollow: Monitor keywords and competitors
- Sensor Tower: Detailed analytics
- App Annie: Market intelligence

Simple free approach:
- Search for your keywords, see where you rank
- Look at top apps in your category for inspiration
- Update keywords every few updates and track results`,
        helpful_link: 'https://developer.apple.com/app-store/search/',
        estimated_time: 'Review monthly, update with each app version',
        is_required: false,
        order: 40,
    },

    // --- Category-Specific Items ---
    {
        id: 'finance-subscription-compliance',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Finance App: Subscription & Payment Compliance',
        description: 'Finance apps have special requirements around how you present subscriptions, fees, and financial information to users.',
        why_it_matters: 'Finance apps are scrutinized more heavily. Apple is very sensitive about apps that could be seen as misleading users about money. Non-compliance can lead to rejection or removal.',
        how_to_do_it: `Requirements for finance apps:
1. Clear subscription pricing BEFORE purchase
2. No hidden fees
3. Explain what happens after free trial ends
4. Don't promise specific returns on investments
5. Appropriate disclaimers for financial advice

Subscription UI requirements:
- Show price per period (e.g., "$4.99/month")
- Show what happens at end of free trial
- Explain how to cancel
- Link to Terms of Service

Investment/Banking apps:
- "Not FDIC insured" if applicable
- "Past performance doesn't guarantee future results"
- Proper licensing disclosures if required
- Region-specific regulations

Avoid:
- "Make money fast" claims
- Guaranteed returns
- Fake account balances in screenshots
- Misleading transaction success rates`,
        estimated_time: '1-2 hours to ensure compliance',
        is_required: true,
        category_specific: ['Finance', 'Business'],
        order: 50,
    },
    {
        id: 'health-medical-disclaimer',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Health App: Medical Disclaimers',
        description: 'Health and fitness apps must include appropriate disclaimers about medical advice and device accuracy.',
        why_it_matters: 'Health apps have significant legal liability. Proper disclaimers protect you and ensure Apple approves your app. Some health features require additional regulatory approval.',
        how_to_do_it: `Required disclaimers:
1. "This app is not a medical device"
2. "Not intended to diagnose, treat, or cure any condition"
3. "Consult a healthcare professional before starting any health program"
4. "Data is for informational purposes only"

Where to include them:
- App description
- In-app onboarding
- Settings/About section
- Before any health-related feature

If your app:
- Tracks health metrics: Explain accuracy limitations
- Suggests exercises: Include safety warnings
- Provides nutrition advice: Note it's not personalized medical advice
- Connects to health devices: List compatible devices clearly

Special categories:
- Mental health apps: Extra sensitivity required
- Medical device apps: May need FDA approval
- HealthKit integration: Additional requirements`,
        estimated_time: '1-2 hours to add proper disclaimers',
        is_required: true,
        category_specific: ['Health & Fitness', 'Medical'],
        order: 51,
    },
    {
        id: 'kids-app-compliance',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Kids Category: Special Requirements',
        description: 'Apps in the Kids category have strict requirements around privacy, advertising, and external links.',
        why_it_matters: 'Kids apps are heavily regulated. Violations can lead to immediate removal and potential legal issues (COPPA, etc.). Apple is very strict about this category.',
        how_to_do_it: `Kids category requirements:
1. No behavioral advertising
2. No third-party analytics that collect identifying info
3. All external links behind parental gates
4. No in-app purchases without parental consent mechanism
5. Age-appropriate content only
6. Privacy policy must address children's data

Parental gate requirements:
- Any link out of the app must have a gate
- Gates must require adult-level action (math problem, written instructions)
- Can't be something a child could easily solve

Data collection:
- Minimize data collection
- No tracking across apps
- COPPA compliance (US)
- GDPR-K compliance (EU)

What to avoid:
- Social features
- User-to-user communication
- Location tracking
- Photo/video sharing
- Connection to social networks`,
        estimated_time: '2-4 hours to ensure full compliance',
        is_required: true,
        category_specific: ['Kids', 'Education'],
        order: 52,
    },
    {
        id: 'subscription-app-requirements',
        phase: 'pre_submission',
        category: 'legal_privacy',
        title: 'Subscription Apps: Apple Requirements',
        description: 'If your app has subscriptions, Apple has specific requirements for how you present and manage them.',
        why_it_matters: 'Subscription-related rejections are very common. Apple cracks down hard on apps that seem to trick users into subscribing. Getting this right is essential.',
        how_to_do_it: `Required information before purchase:
1. Exact price per billing period
2. Length of subscription/billing period
3. Whether subscription auto-renews
4. Free trial length (if any)
5. What happens when trial ends
6. Link to Terms of Service
7. Link to Privacy Policy

Apple guidelines for subscriptions:
- Can't hide the price
- Can't make the "X" or "Skip" button hard to find
- Can't use confusing language
- Must explain what's included clearly
- Must explain how to cancel

Free trial requirements:
- Clearly state when payment starts
- Show what the price will be
- Explain that they'll be charged automatically

In your app:
- Settings: Easy way to manage subscription
- Restore Purchases: Required button
- Clear upgrade/downgrade path

Testing subscriptions:
- Use sandbox testing in Xcode
- Test the full flow before submission
- Verify restore purchases works`,
        helpful_link: 'https://developer.apple.com/app-store/subscriptions/',
        estimated_time: '2-4 hours to implement properly',
        is_required: true,
        category_specific: ['Finance', 'Productivity', 'Health & Fitness', 'Entertainment'],
        order: 53,
    },
];

// Helper functions

/**
 * Get checklist items for a specific phase
 */
export function getChecklistByPhase(phase: ChecklistPhase): ChecklistItem[] {
    return LAUNCH_CHECKLIST
        .filter(item => item.phase === phase)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get checklist items filtered by app category
 */
export function getChecklistForCategory(category: string): ChecklistItem[] {
    return LAUNCH_CHECKLIST
        .filter(item => {
            // Include if no category restriction, or if the category matches
            if (!item.category_specific) return true;
            return item.category_specific.includes(category);
        })
        .sort((a, b) => a.order - b.order);
}

/**
 * Get only required items
 */
export function getRequiredItems(): ChecklistItem[] {
    return LAUNCH_CHECKLIST
        .filter(item => item.is_required)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get items by category within a phase
 */
export function getItemsByCategory(phase: ChecklistPhase, category: ChecklistCategory): ChecklistItem[] {
    return LAUNCH_CHECKLIST
        .filter(item => item.phase === phase && item.category === category)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get a summary of items per phase
 */
export function getChecklistSummary(): {
    pre_submission: { total: number; required: number };
    during_review: { total: number; required: number };
    post_approval: { total: number; required: number };
} {
    const phases: ChecklistPhase[] = ['pre_submission', 'during_review', 'post_approval'];
    const summary = {} as Record<ChecklistPhase, { total: number; required: number }>;

    for (const phase of phases) {
        const items = getChecklistByPhase(phase);
        summary[phase] = {
            total: items.length,
            required: items.filter(i => i.is_required).length,
        };
    }

    return summary;
}

/**
 * Format estimated time for display
 */
export function getTotalEstimatedTime(items: ChecklistItem[]): string {
    // This is a rough estimate since times vary
    const itemsWithTime = items.filter(i => i.estimated_time);
    if (itemsWithTime.length === 0) return 'Varies';

    // Count items to give a range
    const requiredCount = items.filter(i => i.is_required).length;

    if (requiredCount <= 10) return '1-2 days';
    if (requiredCount <= 20) return '3-5 days';
    return '1-2 weeks';
}
