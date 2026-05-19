module.exports = {
    mode: "frontend", // frontend | backend | fullstack
    output: "json", // json | chroma
    frontend: "./src",
    backend: "./server",
    api: "./app/api",
    views: "./app",
    php: {
        mode: "backend" // backend | frontend | mixed
    }
};