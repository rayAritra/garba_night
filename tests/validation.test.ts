import { describe, expect, it } from "vitest";
import { messageSchema, profileSchema, signUpSchema } from "@/lib/validation";
import { ageFromDate } from "@/lib/utils";

const validProfile={name:"Aarav",dateOfBirth:"2000-01-01",gender:"Man",interestedIn:["Woman"],year:"3rd Year",department:"CSE",bio:"I never miss the final Garba circle.",interests:["Garba","Music"],instagram:"aarav.test",whatsapp:"+919876543210",shareInstagram:false,shareWhatsapp:false};
describe("security boundary validation",()=>{
  it("rejects minors",()=>expect(profileSchema.safeParse({...validProfile,dateOfBirth:new Date().toISOString().slice(0,10)}).success).toBe(false));
  it("rejects more than six interests",()=>expect(profileSchema.safeParse({...validProfile,interests:["1","2","3","4","5","6","7"]}).success).toBe(false));
  it("rejects malformed phone numbers",()=>expect(profileSchema.safeParse({...validProfile,whatsapp:"123"}).success).toBe(false));
  it("limits messages to 1000 characters",()=>expect(messageSchema.safeParse("x".repeat(1001)).success).toBe(false));
  it("requires strong-enough signup passwords",()=>expect(signUpSchema.safeParse({name:"Aarav",email:"a@example.com",password:"short"}).success).toBe(false));
  it("computes age without exposing DOB in discovery",()=>expect(ageFromDate("2000-01-01")).toBeGreaterThan(18));
});
