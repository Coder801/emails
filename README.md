# Foundation for Emails Template

[![devDependency Status](https://david-dm.org/zurb/foundation-emails-template/dev-status.svg)](https://david-dm.org/zurb/foundation-emails-template#info=devDependencies)

**Please open all issues with this template on the main [Foundation for Emails](http://github.com/zurb/foundation-emails/issues) repo.**

This is the official starter project for [Foundation for Emails](http://foundation.zurb.com/emails), a framework for creating responsive HTML devices that work in any email client. It has a Gulp-powered build system with these features:

- Handlebars HTML templates with [Panini](http://github.com/zurb/panini)
- Simplified HTML email syntax with [Inky](http://github.com/zurb/inky)
- Sass compilation
- Image compression
- Built-in BrowserSync server
- Full email inlining process

## Installation

To use this template, your computer needs [Node.js](https://nodejs.org/en/) 0.12 or greater. The template can be installed with the Foundation CLI, or downloaded and set up manually.

### Manual Setup

To manually set up the template, first download it with Git:

```bash
git clone 'repo-path'
```

Then open the folder in your command line, and install the needed dependencies:

```bash
cd figleaf-emails
npm install
```

## Build Commands

Run `npm start -- --t=templateName` to kick off the build process. A new browser tab will open with a server pointing to your project files.

Run `npm run build -- --t=templateName` to inline your CSS into your HTML along with the rest of the build process.

Run `npm run ztranslate -- --t=templateName --langs=langsCommaSeparated --ztfolder=postman/MacKeeper/FOLDER_NAME/body` to load translations from zTranslate to your working folder.
- --langs=en,ru,de - optional, must be separated with comma, no spaces allowed. All lang by default.

Run `npm run mail -- --t=templateName` to build as above, then send to specified email address for testing. *SMTP server details required (config.json)*

Run `npm run zip -- --t=templateName` to build as above, then zip HTML and images for easy deployment to email marketing services.

Run `npm run screen -- --t=templateName` to build as above, then screenshot. Screenshots save in screen folder (templates/${templateName}/screen)

```json
{
  "aws": {
    "region": "us-east-1",
    "accessKeyId": "YOUR_ACCOUNT_KEY",
    "secretAccessKey": "YOUR_ACCOUNT_SECRET",
    "params": {
        "Bucket": "elasticbeanstalk-us-east-1-THIS_IS_JUST_AN_EXAMPLE"
    },
    "url": "https://s3.amazonaws.com/elasticbeanstalk-us-east-1-THIS_IS_JUST_AN_EXAMPLE"
  }
}
```

## Manual email tests (config.json)

You can have the emails sent to a specified email address. You will need to provide AWS S3 account details in `config.json`. You will also need to specify to details of an SMTP server. The email address to send to emails to can either by configured in the `package.json` file or added as a parameter like so: `npm run mail -- --t=templateName --to="example.com"`

```json
{
  "mail": {
    "to": [
      "example@domain.com"
    ],
    "from": "Company name <info@company.com",
    "smtp": {
      "auth": {
        "user": "example@domain.com",
        "pass": "12345678"
      },
      "host": "smtp.domain.com",
      "secureConnection": true,
      "port": 465
    }
  }
}
```

**Caution:** AWS Service Fees will result, however, are usually very low do to minimal traffic. Use at your own discretion.
