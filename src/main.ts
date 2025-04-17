import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Accept, Authorization",
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
