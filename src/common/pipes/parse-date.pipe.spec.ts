import { BadRequestException } from "@nestjs/common";
import { ArgumentMetadata } from "@nestjs/common";

import { ParseDatePipe } from "./parse-date.pipe";

describe("ParseDatePipe", () => {
  let pipe: ParseDatePipe;

  beforeEach(() => {
    pipe = new ParseDatePipe();
  });

  const createMetadata = (data?: string): ArgumentMetadata => ({
    type: "param",
    metatype: String,
    data,
  });

  it("should be defined", () => {
    expect(pipe).toBeDefined();
  });

  describe("valid dates", () => {
    it("should accept valid date format YYYY-MM-DD", () => {
      const result = pipe.transform("2024-01-15", createMetadata("date"));
      expect(result).toBe("2024-01-15");
    });

    it("should accept first day of month", () => {
      const result = pipe.transform("2024-03-01", createMetadata("date"));
      expect(result).toBe("2024-03-01");
    });

    it("should accept last day of month", () => {
      const result = pipe.transform("2024-12-31", createMetadata("date"));
      expect(result).toBe("2024-12-31");
    });

    it("should accept leap year date", () => {
      const result = pipe.transform("2024-02-29", createMetadata("date"));
      expect(result).toBe("2024-02-29");
    });
  });

  describe("invalid format", () => {
    it("should throw BadRequestException for wrong format (DD-MM-YYYY)", () => {
      expect(() =>
        pipe.transform("15-01-2024", createMetadata("date"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for wrong format (MM/DD/YYYY)", () => {
      expect(() =>
        pipe.transform("01/15/2024", createMetadata("date"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for partial date", () => {
      expect(() => pipe.transform("2024-01", createMetadata("date"))).toThrow(
        BadRequestException
      );
    });

    it("should throw BadRequestException for non-date string", () => {
      expect(() =>
        pipe.transform("not-a-date", createMetadata("date"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for empty string", () => {
      expect(() => pipe.transform("", createMetadata("date"))).toThrow(
        BadRequestException
      );
    });
  });

  describe("invalid dates", () => {
    it("should throw BadRequestException for February 30", () => {
      expect(() =>
        pipe.transform("2024-02-30", createMetadata("customDate"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for February 29 in non-leap year", () => {
      expect(() =>
        pipe.transform("2023-02-29", createMetadata("customDate"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for month 13", () => {
      expect(() =>
        pipe.transform("2024-13-01", createMetadata("date"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for day 32", () => {
      expect(() =>
        pipe.transform("2024-01-32", createMetadata("date"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for month 00", () => {
      expect(() =>
        pipe.transform("2024-00-15", createMetadata("date"))
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for day 00", () => {
      expect(() =>
        pipe.transform("2024-01-00", createMetadata("date"))
      ).toThrow(BadRequestException);
    });
  });

  describe("metadata handling", () => {
    it("should use metadata.data in error message when provided", () => {
      try {
        pipe.transform("invalid", createMetadata("myDateParam"));
      } catch (e) {
        expect((e as BadRequestException).message).toContain("myDateParam");
      }
    });

    it("should use 'date' as default in error message when data is undefined", () => {
      try {
        pipe.transform("invalid", createMetadata());
      } catch (e) {
        expect((e as BadRequestException).message).toContain("date");
      }
    });
  });
});
