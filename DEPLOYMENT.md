# Church App Deployment Guide

## Prerequisites
- A GitHub account
- A Vercel account (for frontend)
- A Railway or Render account (for backend)
- Your Supabase project

## Frontend Deployment (Vercel)

1. **Prepare the Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Connect your GitHub repository
   - Configure the following environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `VITE_API_URL`: Your backend API URL (will be set after backend deployment)

3. **Vercel will automatically deploy your app and provide a URL**

## Backend Deployment (Railway)

1. **Prepare the Backend**
   ```bash
   cd backend
   npm install
   ```

2. **Deploy to Railway**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Connect your GitHub repository
   - Configure the following environment variables:
     - `PORT`: 3001
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_KEY`: Your Supabase service key
     - `CORS_ORIGIN`: Your frontend URL (from Vercel)

3. **Railway will provide you with a deployment URL**

## Database (Supabase)

1. **Configure Security Rules**
   - Go to your Supabase dashboard
   - Navigate to Authentication > Policies
   - Ensure your RLS policies are properly configured

2. **Update CORS Settings**
   - In Supabase dashboard, go to Settings > API
   - Add your frontend domain to the allowed origins

## Final Steps

1. **Update Frontend Environment**
   - Go back to Vercel
   - Update the `VITE_API_URL` to your Railway backend URL

2. **Test the Deployment**
   - Test all features in the production environment
   - Verify that authentication works
   - Check that all API endpoints are accessible

## Monitoring and Maintenance

1. **Set up Monitoring**
   - Vercel provides built-in analytics
   - Railway offers logs and monitoring
   - Supabase has a dashboard for database monitoring

2. **Regular Updates**
   - Keep dependencies updated
   - Monitor for security updates
   - Regularly backup your database

## Troubleshooting

If you encounter issues:

1. **Check Logs**
   - Vercel deployment logs
   - Railway application logs
   - Supabase database logs

2. **Common Issues**
   - CORS errors: Verify CORS settings in both backend and Supabase
   - Authentication issues: Check environment variables
   - Database connection: Verify Supabase credentials

## Support

For additional help:
- Vercel documentation: https://vercel.com/docs
- Railway documentation: https://docs.railway.app
- Supabase documentation: https://supabase.com/docs 