
package main

import (
  "github.com/gofiber/fiber/v2"
  "github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
  app := fiber.New()

  // إعداد CORS
  app.Use(cors.New(cors.Config{
    AllowOrigins: "https://ta4ha.com",  // السماح للنطاق المحدد
    AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
    AllowHeaders: "Content-Type,Authorization",
    AllowCredentials: true, // السماح بإرسال ملفات تعريف الارتباط والمعلومات الحساسة
  }))

  // باقي الكود لإعداد الخادم
  app.Get("/", func(c *fiber.Ctx) error {
    return c.SendString("Hello, World!")
  })

  app.Listen(":3000")
}
