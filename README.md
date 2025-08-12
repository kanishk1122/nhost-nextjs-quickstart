# Nhost Chat Application

A real-time chat application built with Next.js and Nhost, featuring AI-powered responses and authentication.

## Features

- 🔒 User authentication with Nhost (sign up, sign in)
- 💬 Real-time chat functionality
- 🤖 AI-powered chat responses via n8n webhook
- 📱 Responsive design with mobile support
- 💾 Persistent chat history
- 🚀 Built with Next.js App Router

## Tech Stack

- **Frontend**: Next.js 14, React, Apollo Client, TailwindCSS, shadcn/ui
- **Backend**: Nhost (Postgres, Hasura, Authentication)
- **AI Integration**: n8n webhook

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Nhost account and project


### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Run the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Sign up for an account or sign in with existing credentials
2. Create a new chat or continue an existing conversation
3. Type a message and press Enter or click Send
4. The AI will respond to your message

## Database Schema

The application uses the following tables:

- `users` - Managed by Nhost Auth
- `chats` - Stores chat sessions
- `messages` - Stores individual messages

## Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository
2. Import the repository to Vercel
3. Add the environment variables
4. Deploy!

### Deploy with Nhost

You can also deploy the frontend with Nhost:

1. Push your code to GitHub
2. Connect your Nhost project to your GitHub repository
3. Configure the build settings
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
