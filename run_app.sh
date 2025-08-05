#!/bin/bash

# ==============================================================================
# run_app.sh
#
# Foolproof script to install dependencies, manage MongoDB, and run the
# MERN email backup application.
#
# USAGE:
#   ./run_app.sh
#
# ==============================================================================

# --- Configuration ---
# Exit immediately if a command exits with a non-zero status.
set -e

# --- Style and Messaging Functions ---
# Adds color-coded messages to guide the user.
print_info() { echo -e "\033[1;34m[INFO]\033[0m $1"; }
print_success() { echo -e "\033[1;32m[SUCCESS]\033[0m $1"; }
print_warning() { echo -e "\033[1;33m[WARNING]\033[0m $1"; }
print_error() { echo -e "\033[1;31m[ERROR]\033[0m $1" >&2; }


# --- MongoDB and Cleanup ---
DB_PATH="./mongodb/data/"
MONGOD_STARTED_BY_SCRIPT=0 # Flag to track if this script started mongod

# Cleanup function to stop the local MongoDB instance when the script exits.
# This is triggered by 'trap' on script exit or interruption (Ctrl+C).
cleanup() {
  # Only try to stop mongod if this script started it.
  if [ "$MONGOD_STARTED_BY_SCRIPT" -eq 1 ] && [ -f "$DB_PATH/mongod.lock" ]; then
    echo "" # Newline for cleaner exit
    print_info "Shutting down the local MongoDB instance..."
    # The --shutdown command is a cleaner way to stop mongod
    mongod --dbpath "$DB_PATH" --shutdown &> /dev/null || kill $(cat "$DB_PATH/mongod.lock") &> /dev/null
    print_success "Cleanup complete."
  fi
  # Let concurrently handle its child processes.
}

# Trap script exit (EXIT) and interruption (SIGINT/Ctrl+C) to run the cleanup.
trap cleanup EXIT SIGINT


# --- Main Script Execution ---

# 1. Check for Prerequisites
print_info "Step 1: Checking for required tools (pnpm, mongod)..."
if ! command -v pnpm &> /dev/null; then
    print_error "'pnpm' command not found. Please install it first."
    print_warning "You can usually install it with: npm install -g pnpm"
    exit 1
fi
if ! command -v mongod &> /dev/null; then
    print_error "'mongod' command not found (MongoDB Server)."
    print_warning "Please install MongoDB and ensure 'mongod' is in your system's PATH."
    exit 1
fi
print_success "All required tools are available."
echo ""

# 2. Install Dependencies
print_info "Step 2: Installing dependencies for all packages (root, client, server)..."
# The -r flag tells pnpm to perform the installation recursively in all subdirectories.
# This is more efficient than installing in each folder individually.
pnpm -r install
print_success "All dependencies are installed and up to date."
echo ""

# 3. Setup and Run MongoDB
print_info "Step 3: Checking and starting MongoDB..."
MONGO_URI="mongodb://127.0.0.1:27017/all_email_backups"

# Check if a mongod process is already running.
if pgrep -x "mongod" > /dev/null; then
    print_success "An instance of MongoDB is already running."
else
    print_info "MongoDB is not running. Starting a local instance..."
    # Create a local data directory if it doesn't exist.
    if [ ! -d "$DB_PATH" ]; then
        mkdir -p "$DB_PATH"
        print_info "Created MongoDB data directory at: $(pwd)/$DB_PATH"
    fi

    # Start mongod as a background process (--fork) and log to a file.
    mongod --dbpath "$DB_PATH" --port 27017 --logpath "$DB_PATH/mongod.log" --fork

    # Wait a moment for the server to initialize.
    sleep 3

    if pgrep -x "mongod" > /dev/null; then
        MONGOD_STARTED_BY_SCRIPT=1 # Set flag for cleanup
        print_success "Local MongoDB instance started successfully."
        print_info "Log file: $(pwd)/$DB_PATH/mongod.log"
    else
        print_error "Failed to start MongoDB. Check the log for details."
        exit 1
    fi
fi
echo ""

# 4. Run the Application
print_info "Step 4: Launching the application..."
CLIENT_URL="http://localhost:5173"

# --- Final Instructions ---
echo -e "\n-----------------------------------------------------------------"
print_success "✅ All systems go! The application is starting now."
echo ""
echo -e "   Your browser should open automatically, but if it doesn't,"
echo -e "   navigate to this URL:"
echo -e "   ➡️   \033[1;32m$CLIENT_URL\033[0m"
echo ""
echo -e "   On the setup page, you will need to provide:"
echo -e "   1. \033[1;33mMongoDB URI:\033[0m $MONGO_URI"
echo -e "   2. \033[1;33mMS Graph Token:\033[0m (Get this from the MS Graph Explorer)"
echo ""
print_info "Press Ctrl+C in this terminal to stop the application."
echo "-----------------------------------------------------------------"
echo ""

# Launch both the client and server concurrently.
# This command will occupy the terminal until you stop it.
pnpm run dev