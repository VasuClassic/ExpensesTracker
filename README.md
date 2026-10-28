# Daily Expense Tracker

A simple responsive web app for recording and managing daily expenses. Built with HTML, CSS, and vanilla JavaScript.

## Features

- Add expenses with date, amount, category, and optional description
- View today's total and all-time recorded total
- Search expenses and filter by date or category
- Edit and delete expense records
- Export expenses to CSV
- Save records in the current browser using `localStorage`
- Responsive layout for desktop and mobile

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For the best development experience, you can use Visual Studio Code with the Live Server extension.

## Publish with GitHub Pages

1. Create a public GitHub repository, for example `daily-expense-tracker`.
2. Upload `index.html`, the `css` folder, and the `js` folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then click **Save**.
6. Wait for the deployment to finish. Your site will be available at:

   `https://YOUR-USERNAME.github.io/daily-expense-tracker/`

Replace `YOUR-USERNAME` with your GitHub username.

## Storage and privacy

This version stores expenses in the browser's local storage. The data is not uploaded to GitHub or shared with other website visitors. It is available only in the same browser profile on the same device. Clearing browser data can delete these records, so export CSV backups regularly.

This is a client-side demo, not a cloud-synced multi-user database. Do not enter sensitive financial or personal information on a shared device.

## Project structure

```text
daily-expense-tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```
