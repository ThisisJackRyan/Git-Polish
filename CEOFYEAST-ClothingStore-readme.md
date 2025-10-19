# Note Taker

## An Express.js-powered application for taking, saving, and deleting notes, with persistent storage using a JSON file.

## Table of Contents
*   [About](#about)
*   [Features](#features)
*   [Persistent Storage](#persistent-storage)
*   [Technologies Used](#technologies-used)
*   [Usage](#usage)

### About
The Note Taker is a simple yet effective web application designed to help users organize their thoughts, tasks, and ideas. It provides a user-friendly interface to create, view, and manage notes, all powered by a robust Express.js backend that stores data persistently in a JSON file.

### Features
*   **Create New Notes**: Easily compose new notes with a title and detailed text content.
*   **View Existing Notes**: All saved notes are displayed in a list, allowing quick access and review.
*   **Save Notes**: New notes are saved automatically to the backend's `db.json` file.
*   **Delete Notes**: Remove unwanted notes with a single click, cleaning up your workspace.
*   **Persistent Storage**: Notes remain saved even after closing and reopening the application, thanks to JSON file storage.

### Persistent Storage
The Note Taker application is designed with data persistence in mind. All notes created, saved, and modified by the user are stored in a dedicated JSON file, `db.json`, located in the application's backend. This approach ensures that your notes are not lost when the application is closed or restarted. The Express.js backend handles the reading and writing operations to this file, making sure your information is always available and up-to-date whenever you access the application.

### Technologies Used
This application leverages the following key technologies:
*   **Node.js**: The JavaScript runtime environment for building the backend.
*   **Express.js**: A fast, unopinionated, minimalist web framework for Node.js, used to create the server and API routes.
*   **UUID**: Used to generate unique IDs for each note, ensuring proper identification for saving and deletion.
*   **HTML/CSS/JavaScript (Frontend)**: Standard web technologies for the client-side user interface and interaction.
*   **JSON**: Utilized as the database format (`db.json`) for storing and retrieving notes.

### Usage
To use the Note Taker application, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/note-taker.git # Replace with the actual repository URL
    cd note-taker
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```
    This will install necessary packages like `express` and `uuid`.

3.  **Start the Application**:
    ```bash
    npm start
    ```
    The application will typically run on `http://localhost:3001` (or the PORT specified in `server.js`).

4.  **Access the Application**:
    Open your web browser and navigate to `http://localhost:3001`.

5.  **Taking Notes**:
    *   On the landing page, click "Get Started" to navigate to the notes page.
    *   Enter a `Note Title` and `Note Text` in the respective fields.
    *   Click the save icon (a floppy disk icon, typically) in the navigation bar to save your note.
    *   Your new note will appear in the list on the left.
    *   Click on any note in the list to view its full content.
    *   To delete a note, click the trash can icon next to the note's title in the list.