# CDN

Self-hosted Content Delivery Network backend with easy-to-use interface.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Routes](#routes)
- [License](#license)

## Introduction

This project is an authenticated Content Delivery Network (CDN) service that allows registered users to upload, manage, and serve files securely. It uses Node.js, Express, and SQLite for the backend, and EJS for templating.  
If the intended use case is to have one user to host all the files, you can keep the registration activated, register yourself, and then disable registration (instructions below).  
  
This project is intended to act as a backend (a file storage) interface. You should link this with an actual content delivery network, like [Cloudflare](https://www.cloudflare.com/), to achieve best performance.

## Features

- User authentication and registration
- File upload and management
- Secure file serving with hash validation
- Responsive design with dark mode support

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/wsquarepa/CDN.git
    cd https://github.com/wsquarepa/CDN.git
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up the environment variables:
    ```sh
    cp .env.example .env
    ```

4. Update the `.env` file with your configuration.

5. Start the server:
    ```sh
    npm start
    ```

## Usage

- Visit `http://localhost:<PORT>` to access the application.
- Register a new user or log in with existing credentials.
- Upload files through the dashboard.
- Manage and delete files as needed.

## Environment Variables

The following environment variables are required:

- `PORT`: Port the WebServer runs on (Default: 8080)
- `COOKIE_SECRET`: Secret for the cookie. Should be a random string.
- `DISABLE_REGISTRATION`: If set to true-like value (i.e., 1, true, yes), registration will be disabled. (Default: null)

## Routes

### Public Routes
These pages are accessible without authentication.  
  
- `GET /`: Home page
- `GET /auth/login`: Login page
- `GET /auth/register`: Registration page

### Authenticated Routes
These pages require authentication to access.  
  
- `GET /dashboard`: User dashboard
- `POST /dashboard/upload`: Upload a file
- `POST /dashboard/delete`: Delete a file

## Validated Routes
These pages require validation in the form of a hash to access content.  
  
- `GET /content/:userId/:filename`: Serve a file

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.