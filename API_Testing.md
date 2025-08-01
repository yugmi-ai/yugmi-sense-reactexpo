# Construction Monitoring Backend - Complete API Testing Flow

## Prerequisites
- Backend server running on `http://localhost:3000`
- PostgreSQL database connected
- AWS S3 configured (for file uploads)
- OpenAI or Gemini API key configured

## Testing Tools
- Postman, Insomnia, or curl
- Sample images/videos for upload testing

---

## 1. AUTHENTICATION FLOW

### 1.1 Register Individual User
**POST** `/api/auth/register`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "individual"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "individual",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "organization": null,
    "token": "jwt-token-here"
  }
}
```

### 1.2 Register Organization User
**POST** `/api/auth/register`

**Body:**
```json
{
  "email": "admin@constructionco.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "userType": "organization",
  "organizationData": {
    "name": "Construction Co Ltd",
    "email": "info@constructionco.com",
    "phone": "1234567890",
    "address": "123 Construction Street, City, State"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@constructionco.com",
      "firstName": "Admin",
      "lastName": "User",
      "userType": "organization",
      "organizationId": "org-uuid-here",
      "roleId": "role-uuid-here"
    },
    "organization": {
      "id": "org-uuid-here",
      "name": "Construction Co Ltd",
      "email": "info@constructionco.com"
    },
    "token": "jwt-token-here"
  }
}
```

### 1.3 Login User
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "admin@constructionco.com",
  "password": "admin123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@constructionco.com",
      "firstName": "Admin",
      "lastName": "User",
      "userType": "organization"
    },
    "token": "jwt-token-here"
  }
}
```

### 1.4 Get User Profile
**GET** `/api/auth/profile`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@constructionco.com",
      "firstName": "Admin",
      "lastName": "User",
      "userType": "organization",
      "organization": {
        "name": "Construction Co Ltd"
      },
      "role": {
        "name": "Organization Admin",
        "permissions": {
          "canCreateProject": true,
          "canManageUsers": true
        }
      }
    }
  }
}
```

---

## 2. PROJECT MANAGEMENT FLOW

### 2.1 Create Project (Organization Admin Only)
**POST** `/api/projects`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "name": "Downtown Office Complex",
  "description": "50-story office building construction project",
  "address": "456 Downtown Ave, Metro City",
  "startDate": "2024-01-15",
  "endDate": "2025-12-31",
  "budget": 50000000.00,
  "wbsData": {
    "1.0": "Foundation",
    "2.0": "Structure",
    "3.0": "MEP Systems",
    "4.0": "Finishing"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "project-uuid-here",
      "name": "Downtown Office Complex",
      "description": "50-story office building construction project",
      "organizationId": "org-uuid-here",
      "status": "planning",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2.2 Get All Projects
**GET** `/api/projects?page=1&limit=10&status=active`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project-uuid-here",
        "name": "Downtown Office Complex",
        "status": "planning",
        "organization": {
          "name": "Construction Co Ltd"
        },
        "sites": []
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 2.3 Get Project by ID
**GET** `/api/projects/{project-id}`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project-uuid-here",
      "name": "Downtown Office Complex",
      "description": "50-story office building construction project",
      "wbsData": {
        "1.0": "Foundation",
        "2.0": "Structure"
      },
      "sites": [
        {
          "id": "site-uuid-here",
          "name": "Foundation Site A"
        }
      ]
    }
  }
}
```

### 2.4 Update Project
**PUT** `/api/projects/{project-id}`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "status": "active",
  "budget": 55000000.00
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {
      "id": "project-uuid-here",
      "status": "active",
      "budget": "55000000.00"
    }
  }
}
```

---

## 3. SITE MANAGEMENT FLOW

### 3.1 Create Site
**POST** `/api/sites`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "name": "Foundation Site A",
  "description": "Foundation work for Tower A",
  "projectId": "project-uuid-here",
  "operationType": "progress-monitoring",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "456 Downtown Ave, Foundation Area",
  "structureType": "Building",
  "wbsMapping": {
    "1.1": "Excavation",
    "1.2": "Concrete Pour",
    "1.3": "Reinforcement"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Site created successfully",
  "data": {
    "site": {
      "id": "site-uuid-here",
      "name": "Foundation Site A",
      "operationType": "progress-monitoring",
      "projectId": "project-uuid-here",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3.2 Get All Sites
**GET** `/api/sites?operationType=progress-monitoring&projectId={project-id}`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "site-uuid-here",
        "name": "Foundation Site A",
        "operationType": "progress-monitoring",
        "project": {
          "name": "Downtown Office Complex"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 3.3 Assign User to Site (Organization Admin)
**POST** `/api/sites/assign-user`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "siteId": "site-uuid-here",
  "userId": "user-uuid-here",
  "accessLevel": "capture"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "User assigned to site successfully"
}
```

---

## 4. CAPTURE FLOW (Core Feature)

### 4.1 Create Capture (Upload Image/Video)
**POST** `/api/captures`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Body (multipart/form-data):**
```
mediaFile: [Select image/video file]
siteId: "site-uuid-here"
mediaType: "image"
fileName: "foundation_progress_001.jpg"
wbsId: "1.1"
structurePart: "Foundation Wall East"
sensorData: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "altitude": 10.5,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "cameraParams": {
    "focus": 2.8,
    "exposure": "1/125",
    "iso": 200,
    "shutterSpeed": "1/125",
    "aperture": "f/2.8"
  },
  "accelerometer": {
    "x": 0.1,
    "y": 0.2,
    "z": 9.8
  },
  "gyroscope": {
    "x": 0.01,
    "y": 0.02,
    "z": 0.01
  },
  "compass": 45.5,
  "deviceInfo": {
    "model": "iPhone 14 Pro",
    "os": "iOS 17.0",
    "appVersion": "1.0.0"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Capture created successfully",
  "data": {
    "capture": {
      "id": "capture-uuid-here",
      "siteId": "site-uuid-here",
      "mediaType": "image",
      "fileName": "foundation_progress_001.jpg",
      "s3Url": "https://bucket.s3.amazonaws.com/path/to/file.jpg",
      "processingStatus": "pending",
      "wbsId": "1.1",
      "structurePart": "Foundation Wall East",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

### 4.2 Get All Captures
**GET** `/api/captures?siteId={site-id}&mediaType=image&processingStatus=completed&page=1&limit=10`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "captures": [
      {
        "id": "capture-uuid-here",
        "fileName": "foundation_progress_001.jpg",
        "mediaType": "image",
        "processingStatus": "completed",
        "signedUrl": "https://bucket.s3.amazonaws.com/signed-url",
        "thumbnailSignedUrl": "https://bucket.s3.amazonaws.com/thumb-signed-url",
        "aiAnalysis": {
          "summary": "Foundation work appears to be 75% complete...",
          "defects": [],
          "progressStatus": 75,
          "confidence": 0.9
        },
        "site": {
          "name": "Foundation Site A",
          "operationType": "progress-monitoring"
        },
        "annotations": []
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 4.3 Get Capture by ID
**GET** `/api/captures/{capture-id}`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "capture": {
      "id": "capture-uuid-here",
      "fileName": "foundation_progress_001.jpg",
      "signedUrl": "https://bucket.s3.amazonaws.com/signed-url",
      "sensorData": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "cameraParams": {
          "iso": 200
        }
      },
      "aiAnalysis": {
        "summary": "Foundation work shows good progress...",
        "defects": [
          {
            "type": "crack",
            "description": "Minor surface crack visible on east wall",
            "severity": "low"
          }
        ],
        "progressStatus": 75,
        "confidence": 0.9,
        "apiProvider": "openai"
      },
      "annotations": []
    }
  }
}
```

### 4.4 Redo AI Analysis with Custom Prompt
**POST** `/api/captures/{capture-id}/ai-analysis/redo`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "customPrompt": "Focus specifically on concrete quality and any visible defects in the foundation walls. Provide detailed assessment of surface finish quality."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "AI analysis redone successfully",
  "data": {
    "aiAnalysis": {
      "summary": "Concrete quality assessment: Surface finish is excellent with minimal imperfections...",
      "defects": [
        {
          "type": "surface_imperfection",
          "description": "Minor honeycomb pattern visible in section 3",
          "severity": "low"
        }
      ],
      "confidence": 0.95,
      "customPrompt": "Focus specifically on concrete quality..."
    }
  }
}
```

### 4.5 Add Annotation to Capture
**POST** `/api/captures/{capture-id}/annotations`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "type": "measurement",
  "coordinates": [
    {"x": 100, "y": 150},
    {"x": 300, "y": 150}
  ],
  "label": "Wall Height",
  "measurement": {
    "value": 3.2,
    "unit": "meters",
    "description": "Foundation wall height measurement"
  },
  "color": "#FF0000",
  "strokeWidth": 3,
  "notes": "Measured using depth map data"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Annotation added successfully",
  "data": {
    "annotation": {
      "id": "annotation-uuid-here",
      "captureId": "capture-uuid-here",
      "type": "measurement",
      "label": "Wall Height",
      "measurement": {
        "value": 3.2,
        "unit": "meters"
      },
      "createdAt": "2024-01-01T12:30:00.000Z"
    }
  }
}
```

### 4.6 Share Capture
**POST** `/api/captures/{capture-id}/share`

**Headers:**
```json
{
  "Authorization": "Bearer jwt-token-here",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "method": "email",
  "recipient": "supervisor@constructionco.com"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Capture shared via email successfully"
}
```

**Body for WhatsApp:**
```json
{
  "method": "whatsapp",
  "recipient": "+1234567890"
}
```

---

## 5. ERROR TESTING SCENARIOS

### 5.1 Test Authentication Errors
**POST** `/api/auth/login` (Invalid credentials)

**Body:**
```json
{
  "email": "wrong@email.com",
  "password": "wrongpassword"
}
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 5.2 Test Authorization Errors
**POST** `/api/projects` (Without token)

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 5.3 Test Permission Errors
**POST** `/api/projects` (Individual user trying to create project)

**Headers:**
```json
{
  "Authorization": "Bearer individual-user-token"
}
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 5.4 Test Validation Errors
**POST** `/api/auth/register` (Invalid email)

**Body:**
```json
{
  "email": "invalid-email",
  "password": "123",
  "firstName": "",
  "lastName": "Doe",
  "userType": "individual"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    },
    {
      "field": "firstName",
      "message": "First name is required"
    }
  ]
}
```

---

## 6. TESTING SEQUENCE RECOMMENDATIONS

### Phase 1: Basic Setup
1. Register organization admin
2. Login as organization admin
3. Create a project
4. Create a site with operation type

### Phase 2: User Management
1. Create additional organization users
2. Assign users to sites
3. Test role-based access

### Phase 3: Core Functionality
1. Login as site user
2. Upload captures with sensor data
3. Wait for AI analysis completion
4. Test annotation features
5. Test sharing functionality

### Phase 4: Advanced Features
1. Test AI analysis redo with custom prompts
2. Test different operation types (auditing, inspection)
3. Test file upload limits and error handling

### Phase 5: Edge Cases
1. Test with invalid tokens
2. Test permission boundaries
3. Test file upload failures
4. Test AI API failures

---

## 7. SAMPLE TEST DATA SETS

### Sample Organization Data
```json
{
  "name": "ABC Construction Ltd",
  "email": "info@abcconstruction.com",
  "phone": "555-0123",
  "address": "789 Builder's Lane, Construction City, CC 12345"
}
```

### Sample Project Data
```json
{
  "name": "Residential Complex Phase 1",
  "description": "200-unit residential development",
  "address": "100 Residential Drive, Suburb City",
  "startDate": "2024-02-01",
  "endDate": "2025-08-31",
  "budget": 25000000.00,
  "wbsData": {
    "1.0": "Site Preparation",
    "2.0": "Foundation",
    "3.0": "Superstructure",
    "4.0": "MEP",
    "5.0": "Finishes"
  }
}
```

### Sample Site Data for Different Operation Types
```json
// Progress Monitoring Site
{
  "name": "Building A - Structure",
  "operationType": "progress-monitoring",
  "structureType": "Residential Building"
}

// Auditing Site
{
  "name": "Quality Control Zone",
  "operationType": "auditing",
  "structureType": "Mixed Use"
}

// Inspection Site
{
  "name": "Safety Inspection Area",
  "operationType": "inspection",
  "structureType": "Infrastructure"
}
```

---

## 8. POSTMAN COLLECTION SETUP

Create a Postman collection with:

### Environment Variables
- `base_url`: `http://localhost:3000`
- `auth_token`: `{{token}}` (auto-updated from login response)
- `org_id`: `{{organization_id}}`
- `project_id`: `{{project_id}}`
- `site_id`: `{{site_id}}`
- `capture_id`: `{{capture_id}}`

### Pre-request Scripts (for auth endpoints)
```javascript
// Auto-save token from login response
pm.test("Save auth token", function () {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set("auth_token", jsonData.data.token);
    }
});
```

This comprehensive testing guide covers all major API endpoints and scenarios. Start with the authentication flow and work through each section systematically to ensure your backend is working correctly.