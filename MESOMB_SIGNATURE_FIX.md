# MeSomb Signature Format Issue - Deep Dive

## Problem
HTTP 403 with error: "Your authorization header is in an invalid format. Check our documentation to have the correct format."

## Current Implementation
```typescript
// mesomb.service.ts line 282
Authorization: `HMAC-SHA256 ${this.appKey}:${signature}`
```

## Possibilities for Invalid Format

### 1. Signature Encoding Issue
The bodyHash is calculated as:
```typescript
createHmac('sha256', appSecret)
  .update(JSON.stringify(body))
  .digest('base64')  // Changed from 'hex' to 'base64'
```

### 2. Nonce Format
Current: `crypto.randomBytes(16).toString('hex')` = 32 chars
MeSomb might expect different format

### 3. Date Format
Current: ISO string with milliseconds: `2026-03-23T11:01:11.877Z`
MeSomb might expect different precision

### 4. Header Name Typo
Check if `X-MeSomb-Nonce` should be `X-Mesomb-Nonce` or different

### 5. Missing or Extra Headers
```
X-MeSomb-Application: appKey
X-MeSomb-Date: date  
X-MeSomb-Nonce: nonce
Authorization: HMAC-SHA256 appKey:signature
Content-Type: application/json
```

## Next Steps to Debug

1. **Check Official MeSomb Documentation**
   - Go to: https://mesomb.hachther.com/documentation
   - Look for: "Authorization Header Format" or "API Authentication"
   - Check: Signature generation examples, header format, date format

2. **Verify Header Case Sensitivity**
   - Try: `x-mesomb-application`, `X-Mesomb-Application`
   - See if API is case-sensitive

3. **Test with curl and Real Credentials**
   - If user has real MeSomb account, test with curl examples from docs

4. **Check if Signature Should Be Different**
   - Some APIs require: `HMAC-SHA256 keyId=appKey, signature=sig`
   - Not: `HMAC-SHA256 appKey:signature`

5. **Verify Body Encoding**
   - Maybe body should be sent differently (form-urlencoded, not JSON)

## Quick Action
User should:
1. Visit https://mesomb.hachther.com/documentation
2. Find the "cURL example" for payment/collect
3. Copy exact header format from example
4. Compare with current implementation
