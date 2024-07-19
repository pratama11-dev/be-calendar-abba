# Base image with Node.js
from node:16-alpine as deps

RUN apt-get update && apt-get install git -y

# Set work directory
RUN mkdir /app
WORKDIR /app
RUN cd /app && git clone https://puthere@github.com/put-here.git .
RUN npx prisma generate
RUN npm run build
RUN cp -r ./templates /app/dist/templates

# Set the command to run your app
CMD ["npm", "run", "start"]
