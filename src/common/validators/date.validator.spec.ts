import { validate } from "class-validator";

import { IsAfterDate, IsDateString, IsNotFutureDate } from "./date.validator";

class TestDateStringDto {
  @IsDateString()
  date: string;
}

class TestNotFutureDateDto {
  @IsNotFutureDate()
  date: string;
}

class TestAfterDateDto {
  @IsDateString()
  dateDebut: string;

  @IsAfterDate("dateDebut")
  dateFin: string;
}

describe("Date Validators", () => {
  describe("IsDateString", () => {
    it("should accept valid YYYY-MM-DD date", async () => {
      const dto = new TestDateStringDto();
      dto.date = "2024-06-15";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should reject invalid format", async () => {
      const dto = new TestDateStringDto();
      dto.date = "15/06/2024";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject non-string value", async () => {
      const dto = new TestDateStringDto();
      (dto as any).date = 123;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject invalid date like 2024-02-30", async () => {
      const dto = new TestDateStringDto();
      dto.date = "2024-02-30";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject invalid month", async () => {
      const dto = new TestDateStringDto();
      dto.date = "2024-13-01";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should accept leap year date", async () => {
      const dto = new TestDateStringDto();
      dto.date = "2024-02-29";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should reject Feb 29 on non-leap year", async () => {
      const dto = new TestDateStringDto();
      dto.date = "2023-02-29";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("IsNotFutureDate", () => {
    it("should accept past date", async () => {
      const dto = new TestNotFutureDateDto();
      dto.date = "2020-01-01";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept today", async () => {
      const dto = new TestNotFutureDateDto();
      const today = new Date();
      dto.date = today.toISOString().split("T")[0];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should reject future date", async () => {
      const dto = new TestNotFutureDateDto();
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      dto.date = future.toISOString().split("T")[0];

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject non-string value", async () => {
      const dto = new TestNotFutureDateDto();
      (dto as any).date = 42;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("IsAfterDate", () => {
    it("should accept when dateFin is after dateDebut", async () => {
      const dto = new TestAfterDateDto();
      dto.dateDebut = "2024-01-01";
      dto.dateFin = "2024-01-15";

      const errors = await validate(dto);
      const finErrors = errors.filter(e => e.property === "dateFin");
      expect(finErrors).toHaveLength(0);
    });

    it("should reject when dateFin is before dateDebut", async () => {
      const dto = new TestAfterDateDto();
      dto.dateDebut = "2024-06-15";
      dto.dateFin = "2024-01-01";

      const errors = await validate(dto);
      const finErrors = errors.filter(e => e.property === "dateFin");
      expect(finErrors.length).toBeGreaterThan(0);
    });
  });
});
