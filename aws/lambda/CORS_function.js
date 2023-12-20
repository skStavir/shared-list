exports.handler = async (event) => {
    const name = event.queryStringParameters && event.queryStringParameters.name;

    const response = {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "https://lx8aqza6oh.execute-api.us-east-1.amazonaws.com/deploy/v1/shared-list",
            "Access-Control-Allow-Methods": "OPTIONS,PUT,GET"
        },
      
    };

    return response;
};
