# BIA Procedure Module

This module provides a comprehensive Business Impact Analysis (BIA) procedure document generator with AI-powered content enhancement.

## Features

### Core Functionality
- **Document Generation**: Creates professional BIA procedure documents
- **PDF Export**: Generates downloadable PDF documents
- **Organization Integration**: Automatically pulls organization-specific data
- **Impact Matrix**: Displays and exports impact matrix data

### AI-Powered Enhancements
- **LLM Integration**: Uses Hugging Face LLM endpoints for content generation
- **Dynamic Content**: Generates contextual content based on organization data
- **Fallback Content**: Provides hardcoded content when LLM is unavailable
- **Impact Scale Matrix**: AI-generated impact severity scales for different time periods
- **Peak Period Prediction**: AI-predicted peak operational periods for departments

## LLM Endpoints Used

The component integrates with the following LLM endpoints:

1. **`/get-description`** - Generates descriptions for processes and departments
2. **`/get-peak-period/`** - Predicts peak operational periods
3. **`/get-impact-scale-matrix`** - Generates impact severity scales
4. **`/generate-bcm-policy`** - Generates BCM policies (available for future use)
5. **`/generate-bcm-questions`** - Generates BCM questions (available for future use)

## Content Sections

### AI-Generated Content
- **Introduction**: Contextual introduction based on organization
- **Scope**: Tailored scope description
- **Objective**: AI-generated objectives
- **Methodology**: Enhanced methodology description
- **Review Frequency**: Dynamic review frequency guidelines

### Fallback Content
When LLM endpoints are unavailable, the component uses hardcoded content based on the provided document images, ensuring the document is always complete.

### Additional AI Features
- **Impact Scale Matrix**: Shows impact severity (0-4) for different time periods
- **Peak Periods**: Displays AI-predicted peak periods for different departments
- **Enhanced Annexure**: Includes AI-generated impact matrices and predictions

## Usage

1. **Navigate to Procedures**: Click on "BIA Procedures" from the main dashboard
2. **Generate AI Content**: Click "Generate with AI" to create enhanced content
3. **Edit Document**: Use the "Edit" mode to modify document information
4. **Toggle AI Content**: Use the checkbox in edit mode to enable/disable AI content
5. **Export PDF**: Click "Generate PDF" to download the final document

## Configuration

### LLM API Configuration
- **Base URL**: `https://Prithivi-nanda-EY-catalyst.hf.space`
- **Authentication**: Bearer token authentication
- **Error Handling**: Graceful fallback to hardcoded content

### Organization Integration
- **Criticality Threshold**: Automatically loaded from organization settings
- **Organization Name**: Retrieved from user authentication
- **Impact Matrix**: Fetched from organization-specific data

## Error Handling

The component includes comprehensive error handling:
- **LLM Failures**: Gracefully falls back to hardcoded content
- **Network Issues**: Displays appropriate error messages
- **Missing Data**: Shows warnings for incomplete organization data
- **PDF Generation**: Validates content before PDF generation

## Future Enhancements

- **Document Upload**: Integration with document upload endpoints
- **Process Mapping**: AI-powered process mapping from uploaded files
- **BCM Policy Generation**: Full BCM policy generation capabilities
- **Custom Templates**: User-defined document templates
- **Collaboration**: Multi-user editing capabilities 