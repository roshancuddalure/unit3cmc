import { Router } from "express";
import { requirePermission, setFlash } from "../../shared/middleware/auth";
import { LogbookService } from "./service";

export function buildLogbookRouter(logbookService: LogbookService): Router {
  const router = Router();

  router.get("/", requirePermission("logbook:write"), async (req, res, next) => {
    try {
      const model = await logbookService.listWorkspace(req.session.user!, {
        periodStart: typeof req.query.periodStart === "string" ? req.query.periodStart : undefined,
        periodEnd: typeof req.query.periodEnd === "string" ? req.query.periodEnd : undefined,
        teamView: typeof req.query.teamView === "string" ? req.query.teamView : undefined,
        memberId: typeof req.query.memberId === "string" ? req.query.memberId : undefined,
        memberPeriodStart: typeof req.query.memberPeriodStart === "string" ? req.query.memberPeriodStart : undefined,
        memberPeriodEnd: typeof req.query.memberPeriodEnd === "string" ? req.query.memberPeriodEnd : undefined,
        entrySearch: typeof req.query.entrySearch === "string" ? req.query.entrySearch : undefined,
        entryCaseType: typeof req.query.entryCaseType === "string" ? req.query.entryCaseType : undefined,
        entryDepartment: typeof req.query.entryDepartment === "string" ? req.query.entryDepartment : undefined,
        entryFlagged: typeof req.query.entryFlagged === "string" ? req.query.entryFlagged : undefined,
        teamEntrySearch: typeof req.query.teamEntrySearch === "string" ? req.query.teamEntrySearch : undefined,
        teamEntryCaseType: typeof req.query.teamEntryCaseType === "string" ? req.query.teamEntryCaseType : undefined,
        teamEntryDepartment: typeof req.query.teamEntryDepartment === "string" ? req.query.teamEntryDepartment : undefined,
        teamEntryFlagged: typeof req.query.teamEntryFlagged === "string" ? req.query.teamEntryFlagged : undefined
      });
      res.render("pages/logbook", model);
    } catch (error) {
      next(error);
    }
  });

  router.get("/print", requirePermission("logbook:write"), async (req, res, next) => {
    try {
      const model = await logbookService.getPrintReport(req.session.user!, {
        mode: typeof req.query.mode === "string" ? req.query.mode : undefined,
        periodStart: typeof req.query.periodStart === "string" ? req.query.periodStart : undefined,
        periodEnd: typeof req.query.periodEnd === "string" ? req.query.periodEnd : undefined,
        memberId: typeof req.query.memberId === "string" ? req.query.memberId : undefined
      });
      res.render("pages/logbook-print", model);
    } catch (error) {
      next(error);
    }
  });

  router.get("/print/case/:entryId", requirePermission("logbook:write"), async (req, res, next) => {
    try {
      const model = await logbookService.getCasePrintReport(req.session.user!, String(req.params.entryId));
      res.render("pages/logbook-case-print", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requirePermission("logbook:write"), async (req, res, next) => {
    try {
      await logbookService.createForUser(req.session.user!, {
        activityDate: req.body.activityDate,
        caseType: req.body.caseType,
        otNumber: req.body.otNumber,
        surgicalDepartment: req.body.surgicalDepartment,
        surgeryName: req.body.surgeryName,
        surgeryStartTime: req.body.surgeryStartTime,
        surgeryEndTime: req.body.surgeryEndTime,
        ageYears: req.body.ageYears,
        gender: req.body.gender,
        asaPhysicalStatus: req.body.asaPhysicalStatus,
        bmi: req.body.bmi,
        supervisionLevel: req.body.supervisionLevel,
        anaestheticPlanned: req.body.anaestheticPlanned,
        airwayManagement: req.body.airwayManagement,
        scopyTechnique: req.body.scopyTechnique,
        intraoperativeEvents: req.body.intraoperativeEvents,
        comorbidities: req.body.comorbidities,
        otherComorbidity: req.body.otherComorbidity,
        procedures: req.body.procedures,
        analgesiaOptions: req.body.analgesiaOptions,
        blockCatheterNames: req.body.blockCatheterNames,
        singleShotBlockNames: req.body.singleShotBlockNames,
        postOperativeCare: req.body.postOperativeCare,
        learningPoints: req.body.learningPoints
      });
      setFlash(req, "success", "De-identified logbook entry added.");
      res.redirect("/logbook");
    } catch (error) {
      next(error);
    }
  });

  return router;
}
