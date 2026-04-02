# Backend Debugging Guide

## 🔍 **How to View Backend Errors**

### **1. Terminal/Console Logs (Primary Method)**

When you run the backend server, all errors appear in your terminal:

```bash
cd L8v2_BE
npm run dev
```

**What you'll see:**
- 🚨 **Error messages** with detailed stack traces
- 📥 **Incoming requests** with timestamps
- 🟢🟡🔴 **Response status** with response times
- 📊 **Request details** (body, params, headers)

### **2. Enhanced Error Logging**

The backend now includes enhanced error logging that shows:

```
🚨 ERROR OCCURRED:
📍 URL: GET /api/events
📅 Timestamp: 2025-01-27T10:30:00.000Z
👤 User Agent: Mozilla/5.0...
📝 Error Message: Database connection failed
🔍 Error Stack: Error: connect ECONNREFUSED...
📊 Request Body: {}
🔗 Request Params: {}
❓ Request Query: {}
📋 Request Headers: {...}
────────────────────────────────────────────────────────────────────────────────
```

### **3. Browser Developer Tools**

1. **Open DevTools** (F12)
2. **Go to Network Tab**
3. **Make API requests** (visit your frontend)
4. **Look for red entries** (failed requests)
5. **Click on failed requests** to see:
   - Request details
   - Response body
   - Error messages

### **4. API Testing Script**

Run the debug script to test all endpoints:

```bash
cd L8v2_BE
node debug-api.js
```

This will test all endpoints and show responses.

### **5. Database Connection Issues**

If you see database errors:

```bash
# Check if database is running
docker ps

# View database logs
docker logs l8v2-db

# Restart database
docker-compose restart db
```

## 🛠️ **Common Error Types & Solutions**

### **Database Connection Errors**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Start the database container

### **Port Already in Use**
```
Error: listen EADDRINUSE :::3000
```
**Solution:** Kill the process using port 3000 or change the port

### **Validation Errors**
```
Error: Validation failed
```
**Solution:** Check request body format and required fields

### **Authentication Errors**
```
Error: JWT token invalid
```
**Solution:** Check if user is logged in and token is valid

## 📊 **Request Logging**

Every API request is now logged with:

- **📥 Incoming Request:** Method, URL, timestamp
- **📊 Request Details:** Body, params (for non-GET requests)
- **🟢🟡🔴 Response:** Status code and response time
- **❌ Error Details:** Full error information for failed requests

## 🔧 **Debugging Commands**

### **Start Backend with Debug Logging**
```bash
cd L8v2_BE
npm run dev
```

### **Test API Endpoints**
```bash
cd L8v2_BE
node debug-api.js
```

### **Check Database Status**
```bash
docker ps | grep l8v2-db
```

### **View Database Logs**
```bash
docker logs l8v2-db
```

### **Restart Backend**
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## 🎯 **Error Response Format**

All errors now return structured responses:

```json
{
  "success": false,
  "error": "Database connection failed",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "path": "/api/events",
  "method": "GET",
  "stack": "Error: connect ECONNREFUSED...",
  "details": "Database connection failed"
}
```

## 🚀 **Quick Debugging Checklist**

1. **✅ Backend Server Running?**
   ```bash
   curl http://localhost:3000/api/events
   ```

2. **✅ Database Connected?**
   - Check Docker containers
   - View database logs

3. **✅ API Endpoints Working?**
   ```bash
   node debug-api.js
   ```

4. **✅ Frontend Connecting?**
   - Check browser network tab
   - Verify API URL in frontend

5. **✅ CORS Issues?**
   - Check browser console for CORS errors
   - Verify backend CORS configuration

## 📱 **Real-time Error Monitoring**

The enhanced logging will show you:

- **Real-time request tracking**
- **Detailed error information**
- **Request/response timing**
- **Full stack traces**
- **Request context (headers, body, params)**

## 🎉 **Success Indicators**

When everything is working correctly, you'll see:

```
📥 GET /api/events - 2025-01-27T10:30:00.000Z
🟢 GET /api/events - 200 (45ms)
📥 GET /api/artists - 2025-01-27T10:30:01.000Z
🟢 GET /api/artists - 200 (32ms)
```

This comprehensive debugging setup will help you quickly identify and resolve any backend issues! 