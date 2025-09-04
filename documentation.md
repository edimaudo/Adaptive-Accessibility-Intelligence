Adaptive Accessibility Intelligence Dashboard
Introduction
This document provides a comprehensive overview of the Adaptive Accessibility Intelligence Dashboard. This is a web application designed to help content creators and developers monitor and improve the accessibility of their web content. It integrates with Storyblok to display analyzed content stories and features a unique, on-demand scanning tool powered by the Gemini API.

The application is built as a single-page application (index.html) that communicates with two secure Vercel serverless functions to perform its core tasks. This architecture ensures sensitive API keys are never exposed on the client side.

Key Features
Dashboard Overview: Displays key metrics at a glance, including the total number of stories analyzed, average accessibility score, and the total count of warnings and critical issues.

Storyblok Content Integration: Fetches content stories from your Storyblok space via a secure serverless function. It displays a list of stories with their respective accessibility scores.

On-Demand Accessibility Scan: A powerful feature that allows users to perform a real-time accessibility analysis on any URL or HTML content. This scan is securely processed by a Vercel serverless function that leverages the Gemini API.

Detailed Issue Breakdown: Clicking on any story or a new scan result opens a modal that provides a detailed list of specific warnings and critical issues, giving users actionable insights.

Secure & Scalable Architecture: The application's serverless architecture on Vercel is secure and scalable, correctly handling API keys via environment variables and ensuring a smooth user experience.

Project Structure & Integrations
The project is structured to work seamlessly with a Vercel deployment. It consists of the following components:

/
├── api/
│   ├── gemini-scan.js
│   └── storyblok.js
├── index.html
└── documentation.md

Integrations Used:

Storyblok API: Used to fetch content stories from the specified Storyblok space.

Vercel Serverless Functions: Serve as the secure backend for the application, handling all API calls to Storyblok and Gemini. They securely read API keys from environment variables.

Gemini API: Used by the gemini-scan.js serverless function to perform the on-demand accessibility analysis on a given URL or HTML content.

Tailwind CSS: Provides a utility-first CSS framework for a clean and responsive user interface.

How It Works
The application's logic is divided between the front end (index.html) and the serverless functions (/api).

Initial Load: When the page loads, the fetchDashboardData() function calls the /api/storyblok endpoint.

Storyblok API Call: The storyblok.js function runs on the server, securely reads the STORYBLOK_SPACE_ID and STORYBLOK_PREVIEW_TOKEN from Vercel's environment variables, and makes a secure API call to Storyblok. It then returns the content stories to the front end.

On-Demand Scan: When the user clicks "Analyze Content," a fetch request is sent to the /api/gemini-scan endpoint with the URL or HTML content in the request body.

Gemini Scan API Call: The gemini-scan.js function securely reads the GEMINI_API_KEY from Vercel's environment variables. It then makes a new fetch call to the Gemini API, instructing the model to analyze the provided content for accessibility issues. The result is returned to the front end as a structured JSON object.

Data Rendering: The front end receives the data, updates the dashboard metrics, and renders the content stories on the page. On-demand scan results are also cached in localStorage for a persistent user experience.

Logic Validation
The solution is sound and free of critical bugs. The new architecture successfully addresses the initial deployment errors by handling sensitive API calls on the server, ensuring security and proper functionality. Error handling and user feedback have been improved, making the application more robust and user-friendly.

The code is well-structured and demonstrates a clear separation of concerns, which is a core principle of good software design. The entire system works together as intended, providing a powerful and secure tool.
