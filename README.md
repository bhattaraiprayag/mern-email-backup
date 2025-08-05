# 📧 MERN Email Backup for Microsoft Graph

A full-stack MERN application designed to fetch and back up your Microsoft 365 emails that have attachments. It provides a simple web interface to connect to your account, list relevant emails, and save them to a MongoDB database.

---

## 🛠️ Tech Stack

* **MongoDB**: NoSQL database for storing email backups.
* **Express.js**: Backend framework for the server-side API.
* **React.js**: Frontend library for building the user interface.
* **Node.js**: JavaScript runtime environment for the backend.
* **Vite**: Frontend tooling for a fast development experience.
* **PNPM**: Fast, disk space-efficient package manager.

---

## ⚙️ Getting Started

Follow these instructions to get the application up and running on your local machine.

### Prerequisites

Make sure you have the following installed on your system:
* [Node.js](https://nodejs.org/) (v18 or later recommended)
* [PNPM](https://pnpm.io/installation)
* [MongoDB](https://www.mongodb.com/try/download/community)

### Installation & Setup

1. **Clone the Repository**

    Clone this project to your local machine.
    ```bash
    git clone [https://github.com/bhattaraiprayag/mern-email-backup](https://github.com/bhattaraiprayag/mern-email-backup)
    cd mern-email-backup
    ```

2. **Install Dependencies**

    Install the project dependencies for both the client and server using `pnpm` in the root directory.
    ```bash
    pnpm install
    ```

3. **Start Your MongoDB Server**

    Before launching the app, you need a running MongoDB instance. Create a directory for the database and then start the server. Run these commands from the project's **root directory**:

    ```bash
    # Create a directory to store database files
    mkdir -p mongodb/data

    # Start the MongoDB server on a specific port (e.g., 27018)
    mongod --dbpath $(pwd)/mongodb/data --port 27018
    ```
    Keep this terminal window open.

4. **Run the Application**

    In a new terminal window (from the project root), start both the backend and frontend servers concurrently with a single command:
    ```bash
    pnpm run dev
    ```
    * The **backend API** will be running on `http://localhost:5001`.
    * The **frontend React app** will be available at `http://localhost:5173`.

---

## 📖 How to Use the App

1. **Open the App**

    Navigate to `http://localhost:5173` in your web browser.

2. **Get Your Credentials**

    You'll need two things for the initial setup page:

    * **Microsoft Graph Access Token**:
        * Go to the [**Microsoft Graph Explorer**](https://developer.microsoft.com/en-us/graph/graph-explorer).
        * Sign in with your Microsoft account.
        * Ensure you have granted permissions for at least `Mail.Read`.
        * Copy the **Access Token**. *Note: This token is short-lived (usually valid for 1 hour).*

    * **MongoDB Connection URI**:
        * Since you started a local MongoDB server in the previous step, your URI will be: `mongodb://127.0.0.1:27018/email_backups`

3. **Connect and Backup**

    * Paste the **Graph Access Token** and the **MongoDB URI** into the input fields on the setup page and click **Connect**.
    * If the connection is successful, you will be directed to the dashboard, which lists all emails from your account that contain attachments.
    * From here, you can select emails and click **Backup Selected** or back them up individually.
    * You can view the contents of an already backed-up email by clicking on its title. ✨
