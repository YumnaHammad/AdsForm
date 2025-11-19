# Vercel Deployment Guide

## Prerequisites

1. **MongoDB Database**: You need a MongoDB database. For production, use **MongoDB Atlas** (free tier available):
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create a database user
   - Whitelist IP addresses (for Vercel, use `0.0.0.0/0` to allow all IPs, or add Vercel's IP ranges)
   - Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority`)

## Environment Variables Required

You need to add **ONE** environment variable in Vercel:

### `MONGODB_URI`
- **Value**: Your MongoDB Atlas connection string
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/collaborative-form?retryWrites=true&w=majority`
- **Important**: Replace `username`, `password`, `cluster`, and `database-name` with your actual values

## Steps to Deploy on Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Click "Add New Project"**

4. **Import your GitHub repository**

5. **Configure the project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

6. **Add Environment Variable**:
   - Click "Environment Variables"
   - Add:
     - **Name**: `MONGODB_URI`
     - **Value**: Your MongoDB Atlas connection string
     - **Environment**: Select all (Production, Preview, Development)

7. **Click "Deploy"**

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variable**:
   ```bash
   vercel env add MONGODB_URI
   ```
   - Enter your MongoDB connection string when prompted
   - Select all environments (Production, Preview, Development)

5. **Redeploy** (to apply the environment variable):
   ```bash
   vercel --prod
   ```

## Post-Deployment Checklist

- [ ] Verify the app is accessible at your Vercel URL
- [ ] Test the form page - fill a field and verify it saves
- [ ] Test the records page - verify you can view submitted records
- [ ] Check Vercel logs for any errors (Dashboard → Your Project → Logs)

## Troubleshooting

### Database Connection Issues

If you see connection errors:

1. **Check MongoDB Atlas Network Access**:
   - Go to MongoDB Atlas → Network Access
   - Make sure `0.0.0.0/0` is whitelisted (or add Vercel's IP ranges)

2. **Verify Connection String**:
   - Make sure your `MONGODB_URI` includes the database name
   - Format: `mongodb+srv://user:pass@cluster.mongodb.net/database-name?retryWrites=true&w=majority`

3. **Check Environment Variable**:
   - In Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `MONGODB_URI` is set correctly
   - Make sure it's available for all environments

### Build Errors

If the build fails:

1. **Check Vercel Build Logs**:
   - Go to your project → Deployments → Click on failed deployment → View Build Logs

2. **Common Issues**:
   - Missing dependencies: Make sure `package.json` has all required packages
   - TypeScript errors: Not applicable (you're using JavaScript)
   - ESLint errors: Check if `next lint` passes locally

## Notes

- Vercel automatically detects Next.js and configures build settings
- Environment variables are encrypted and secure
- You can update environment variables anytime and redeploy
- Vercel provides free SSL certificates automatically
- The app will auto-deploy on every push to your main branch (if connected to GitHub)

