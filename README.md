# QuickShoppingList
Manage your shopping list.Collaborate with family. No login, no tracking

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.1.

## install node and npm

## build the node project
`npm install`


## start the Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build for prod/stage

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

This project also has the backend AWS lambda code. Auto build is enabled. 

## AWS Part

## Creation of Dynamodb table.

To log the id and update it with changes in form of adding items to that particular id, a table was created in data base in Dynamodb namely shared-list with primary key ‘id’.

## Lambda functions.

 Created three lambda functions from the code base namely:-
 getshoppinglist, updateshoppinglist, CORS_function from the code base provided through github.
 
 Getshoppinglist for generating an id and for calling with that id while updateshoppinglist for update the list with that given id and CORS_function to handle HTTP requests(get,put,options) and to allow CORS(Cross Origin Resource Sharing).
  
 Gave necessary IAM permissions in the form of role to the lambda functions so as toIntegrate it with the dynamodb table.
 Testing the lambda function with appropriate payload (payload not for CORS_function)was done successfully.    

## API gateway Integration

 API Gateway enables to connect APIs to various backend services, such as AWS Lambda functions, Amazon EC2 instances, or other HTTP endpoints. For connecting lambda functions to APIs we have created an API 'sharedlist'.

created the required routes for the api according with the lambda functions so here it is GET ( to get an id), GET {id} ( to get the id by calling a particular id), PUT( to update the shopping list associated with a particular id) and OPTIONS ( To describe the communication options for the target resource). 

So Get and GET {id} was integrated with getshoppinglist lambda function and PUT on to updateshoppinglist function while OPTIONS on to CORS_function through ‘Manage integration’.


##  CORS Configuration within API gateway.

Access-control-allow-origin is configured with https://stavir.com
Access-control-allow-headers is configured with content-type.
Access-control-allow-methods with GET,PUT,OPTIONS.

The api was tested through POSTMAN tool and ensured its successful availability.

## S3 Bucket configuration

After successfully build the application soon after making changes within the code in angular js format, using the command ‘ng build’, the files generated within the ‘dist’ folder has to be uploaded to the ‘stavir’ S3 bucket and made public with the changes.

A file named shoppingitems.json was also uploaded to make the suggestion work whenever a user types the first or two letter(s) of the item.

The path to the index was given as ‘stavir.com/tools/sharedlist’.

Finally making objects and folders public with ‘Access Control List’ in S3 and creating an invalidation inside the cloudfront distribution associated with the domain/S3bucket made the website live.

