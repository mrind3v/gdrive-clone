#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Google Drive Clone
Tests all endpoints systematically with real-world data
"""

import requests
import json
import os
import io
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001/api"
TEST_USER = {
    "email": "jane.smith@example.com",
    "password": "password123",
    "name": "Jane Smith"
}

# Global variables for test data
auth_token = None
user_id = None
test_folder_id = None
test_file_id = None
test_share_id = None

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    print()

def make_request(method, endpoint, data=None, files=None, headers=None):
    """Make HTTP request with proper error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    # Add auth header if token exists
    if auth_token and headers is None:
        headers = {"Authorization": f"Bearer {auth_token}"}
    elif auth_token and headers:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=data)
        elif method.upper() == "POST":
            if files:
                response = requests.post(url, files=files, data=data, headers=headers)
            else:
                response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PATCH":
            response = requests.patch(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, params=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_auth_register():
    """Test user registration"""
    global auth_token, user_id
    
    print("🔐 TESTING AUTHENTICATION")
    print("=" * 50)
    
    # Test registration
    response = make_request("POST", "/auth/register", TEST_USER)
    
    if response and response.status_code == 200:
        data = response.json()
        auth_token = data.get("token")
        user_id = data.get("user", {}).get("id")
        print_test_result("POST /api/auth/register", True, f"User registered successfully. Token: {auth_token[:20]}...")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/auth/register", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return False

def test_auth_login():
    """Test user login"""
    global auth_token, user_id
    
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if response and response.status_code == 200:
        data = response.json()
        auth_token = data.get("token")
        user_id = data.get("user", {}).get("id")
        print_test_result("POST /api/auth/login", True, f"Login successful. User ID: {user_id}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/auth/login", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return False

def test_auth_me():
    """Test token validation"""
    response = make_request("GET", "/auth/me")
    
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("GET /api/auth/me", True, f"Token valid. User: {data.get('name')} ({data.get('email')})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("GET /api/auth/me", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return False

def test_folders():
    """Test folder operations"""
    global test_folder_id
    
    print("📁 TESTING FOLDERS")
    print("=" * 50)
    
    # Create root folder
    folder_data = {"name": "My Documents"}
    response = make_request("POST", "/folders", folder_data)
    
    if response and response.status_code == 200:
        data = response.json()
        test_folder_id = data.get("id")
        print_test_result("POST /api/folders (root)", True, f"Folder created: {data.get('name')} (ID: {test_folder_id})")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/folders (root)", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return False
    
    # Create nested folder
    nested_folder_data = {"name": "Projects", "parentId": test_folder_id}
    response = make_request("POST", "/folders", nested_folder_data)
    
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("POST /api/folders (nested)", True, f"Nested folder created: {data.get('name')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/folders (nested)", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
    
    return True

def test_files():
    """Test file operations"""
    global test_file_id
    
    print("📄 TESTING FILES")
    print("=" * 50)
    
    # Create test files
    test_files = [
        ("test_document.txt", "text/plain", "This is a test document with some content for testing purposes."),
        ("test_image.jpg", "image/jpeg", b"fake_jpeg_content_for_testing"),
        ("test_pdf.pdf", "application/pdf", b"fake_pdf_content_for_testing")
    ]
    
    for filename, content_type, content in test_files:
        # Prepare file data
        if isinstance(content, str):
            file_content = content.encode('utf-8')
        else:
            file_content = content
        
        files = {"file": (filename, io.BytesIO(file_content), content_type)}
        data = {"folderId": test_folder_id} if test_folder_id else {}
        
        response = make_request("POST", "/files/upload", data=data, files=files)
        
        if response and response.status_code == 200:
            file_data = response.json()
            if not test_file_id:  # Store first file ID for later tests
                test_file_id = file_data.get("id")
            print_test_result(f"POST /api/files/upload ({filename})", True, f"File uploaded: {file_data.get('name')} (Size: {file_data.get('size')} bytes)")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print_test_result(f"POST /api/files/upload ({filename})", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_file_download():
    """Test file download"""
    if not test_file_id:
        print_test_result("GET /api/files/{id}/download", False, "No test file ID available")
        return
    
    response = make_request("GET", f"/files/{test_file_id}/download")
    
    if response and response.status_code == 200:
        print_test_result("GET /api/files/{id}/download", True, f"File downloaded successfully. Content-Type: {response.headers.get('content-type')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("GET /api/files/{id}/download", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_drive_views():
    """Test different drive views"""
    print("👁️ TESTING DRIVE VIEWS")
    print("=" * 50)
    
    views = ["drive", "recent", "starred", "trash"]
    
    for view in views:
        response = make_request("GET", f"/drive/items?view={view}")
        
        if response and response.status_code == 200:
            data = response.json()
            folder_count = len(data.get("folders", []))
            file_count = len(data.get("files", []))
            print_test_result(f"GET /api/drive/items?view={view}", True, f"Found {folder_count} folders, {file_count} files")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print_test_result(f"GET /api/drive/items?view={view}", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_search():
    """Test search functionality"""
    response = make_request("GET", "/drive/items?view=drive&search=test")
    
    if response and response.status_code == 200:
        data = response.json()
        total_items = len(data.get("folders", [])) + len(data.get("files", []))
        print_test_result("GET /api/drive/items?search=test", True, f"Search returned {total_items} items")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("GET /api/drive/items?search=test", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_item_updates():
    """Test item update operations"""
    print("✏️ TESTING ITEM UPDATES")
    print("=" * 50)
    
    if not test_file_id:
        print_test_result("PATCH /api/items/{id} (rename)", False, "No test file ID available")
        return
    
    # Test rename
    update_data = {"name": "renamed_test_document.txt"}
    response = make_request("PATCH", f"/items/{test_file_id}", update_data)
    
    if response and response.status_code == 200:
        print_test_result("PATCH /api/items/{id} (rename)", True, "File renamed successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("PATCH /api/items/{id} (rename)", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
    
    # Test star
    update_data = {"starred": True}
    response = make_request("PATCH", f"/items/{test_file_id}", update_data)
    
    if response and response.status_code == 200:
        print_test_result("PATCH /api/items/{id} (star)", True, "File starred successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("PATCH /api/items/{id} (star)", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_trash_operations():
    """Test trash and restore operations"""
    if not test_file_id:
        print_test_result("DELETE /api/items/{id} (trash)", False, "No test file ID available")
        return
    
    # Move to trash
    response = make_request("DELETE", f"/items/{test_file_id}")
    
    if response and response.status_code == 200:
        print_test_result("DELETE /api/items/{id} (trash)", True, "Item moved to trash")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("DELETE /api/items/{id} (trash)", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return
    
    # Restore from trash
    response = make_request("POST", f"/items/{test_file_id}/restore")
    
    if response and response.status_code == 200:
        print_test_result("POST /api/items/{id}/restore", True, "Item restored from trash")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/items/{id}/restore", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_sharing():
    """Test sharing operations"""
    print("🤝 TESTING SHARING")
    print("=" * 50)
    
    if not test_file_id:
        print_test_result("POST /api/shares", False, "No test file ID available")
        return
    
    # Create a second user for sharing
    second_user = {
        "email": "john.doe@example.com",
        "name": "John Doe",
        "password": "password456"
    }
    
    # Register second user
    response = make_request("POST", "/auth/register", second_user, headers={})
    if not (response and response.status_code == 200):
        print_test_result("POST /api/shares (setup)", False, "Could not create second user for sharing test")
        return
    
    # Share file with second user
    share_data = {
        "itemId": test_file_id,
        "email": second_user["email"],
        "permission": "viewer"
    }
    
    response = make_request("POST", "/shares", share_data)
    
    if response and response.status_code == 200:
        share_data_response = response.json()
        global test_share_id
        test_share_id = share_data_response.get("id")
        print_test_result("POST /api/shares", True, f"File shared with {second_user['email']}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/shares", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return
    
    # Get shares for item
    response = make_request("GET", f"/shares/{test_file_id}")
    
    if response and response.status_code == 200:
        shares = response.json()
        print_test_result("GET /api/shares/{itemId}", True, f"Retrieved {len(shares)} shares")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("GET /api/shares/{itemId}", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_comments():
    """Test comment operations"""
    print("💬 TESTING COMMENTS")
    print("=" * 50)
    
    if not test_file_id:
        print_test_result("POST /api/comments", False, "No test file ID available")
        return
    
    # Add comment
    comment_data = {
        "fileId": test_file_id,
        "text": "This is a test comment on the document. Great work on this file!"
    }
    
    response = make_request("POST", "/comments", comment_data)
    
    if response and response.status_code == 200:
        comment_response = response.json()
        print_test_result("POST /api/comments", True, f"Comment added by {comment_response.get('userName')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("POST /api/comments", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
        return
    
    # Get comments
    response = make_request("GET", f"/comments/{test_file_id}")
    
    if response and response.status_code == 200:
        comments = response.json()
        print_test_result("GET /api/comments/{fileId}", True, f"Retrieved {len(comments)} comments")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("GET /api/comments/{fileId}", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def test_storage():
    """Test storage information"""
    print("💾 TESTING STORAGE")
    print("=" * 50)
    
    response = make_request("GET", "/storage")
    
    if response and response.status_code == 200:
        storage_data = response.json()
        used = storage_data.get("used", 0)
        total = storage_data.get("total", 0)
        breakdown = storage_data.get("breakdown", {})
        print_test_result("GET /api/storage", True, f"Used: {used} bytes, Total: {total} bytes, Breakdown: {breakdown}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("GET /api/storage", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def cleanup_shares():
    """Clean up test shares"""
    if test_share_id:
        response = make_request("DELETE", f"/shares/{test_share_id}")
        if response and response.status_code == 200:
            print_test_result("DELETE /api/shares/{shareId}", True, "Share revoked successfully")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print_test_result("DELETE /api/shares/{shareId}", False, f"Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

def main():
    """Run all tests"""
    print("🚀 GOOGLE DRIVE CLONE - BACKEND API TESTING")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print(f"Test user: {TEST_USER['email']}")
    print("=" * 60)
    print()
    
    # Authentication tests
    if not test_auth_register():
        # If registration fails, try login
        if not test_auth_login():
            print("❌ Authentication failed. Cannot proceed with other tests.")
            return
    
    test_auth_me()
    
    # Core functionality tests
    test_folders()
    test_files()
    test_file_download()
    test_drive_views()
    test_search()
    test_item_updates()
    test_trash_operations()
    test_sharing()
    test_comments()
    test_storage()
    
    # Cleanup
    cleanup_shares()
    
    print("🏁 TESTING COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()