'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { MasterOutput, TripContext, Task, SpecialistOutput, MergedItinerary } from '@/lib/schemas/agent';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TracePanelProps {
  masterOutput: MasterOutput | null;
  tripContext: TripContext | null;
  tasks?: Task[];
  specialistOutputs?: SpecialistOutput[];
  mergedItinerary?: MergedItinerary | null;
  runStatus?: 'in-progress' | 'completed' | 'failed';
}

export function TracePanel({
  masterOutput,
  tripContext,
  tasks = [],
  specialistOutputs = [],
  mergedItinerary = null,
  runStatus = 'in-progress'
}: TracePanelProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg md:text-xl">Execution Trace</CardTitle>
            <CardDescription className="text-sm">Agent orchestration and decision flow</CardDescription>
          </div>
          <Badge
            variant={runStatus === 'completed' ? 'default' : runStatus === 'failed' ? 'destructive' : 'secondary'}
            className="self-start md:self-auto"
          >
            {runStatus === 'in-progress' && <Clock className="w-3 h-3 mr-1" />}
            {runStatus === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {runStatus === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
            {runStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4 md:p-6">
        <Tabs defaultValue="context" className="h-full flex flex-col">
          <TabsList className="shrink-0 grid w-full grid-cols-5 text-xs md:text-sm h-auto md:h-10">
            <TabsTrigger value="context" className="py-2 px-1 md:px-3">Context</TabsTrigger>
            <TabsTrigger value="tasks" className="py-2 px-1 md:px-3">Tasks</TabsTrigger>
            <TabsTrigger value="specialists" className="py-2 px-1 md:px-3">Specialists</TabsTrigger>
            <TabsTrigger value="merged">Merged</TabsTrigger>
            <TabsTrigger value="run">Run</TabsTrigger>
          </TabsList>

          {/* CONTEXT TAB */}
          <TabsContent value="context" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {tripContext ? (
                <div className="space-y-4">
                  {/* Question Ledger */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">📋 Question Ledger</h3>
                    {tripContext.questionLedger && tripContext.questionLedger.asked && tripContext.questionLedger.asked.length > 0 ? (
                      <div className="space-y-3">
                        {/* Answered Questions */}
                        {tripContext.questionLedger.asked.some(q => q.status === 'answered') && (
                          <div>
                            <p className="text-xs text-green-600 font-medium mb-1">✅ Answered ({tripContext.questionLedger.asked.filter(q => q.status === 'answered').length})</p>
                            <div className="space-y-2">
                              {tripContext.questionLedger.asked.filter(q => q.status === 'answered').map((entry) => (
                                <div key={entry.id} className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                                  <p className="font-medium text-green-900">{entry.text}</p>
                                  {entry.answeredText && <p className="text-green-700 mt-1">→ {entry.answeredText}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outstanding Questions */}
                        {tripContext.questionLedger.asked.some(q => q.status === 'asked') && (
                          <div>
                            <p className="text-xs text-amber-600 font-medium mb-1">⏳ Outstanding ({tripContext.questionLedger.asked.filter(q => q.status === 'asked').length})</p>
                            <div className="space-y-2">
                              {tripContext.questionLedger.asked.filter(q => q.status === 'asked').map((entry) => (
                                <div key={entry.id} className="bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                                  <p className="font-medium text-amber-900">{entry.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No questions in ledger</p>
                    )}
                  </div>

                  <Separator />

                  {/* Trip Details */}
                  {tripContext.trip && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">🌍 Trip Details</h3>
                      <div className="bg-slate-50 rounded p-3 space-y-2 text-xs">
                        {tripContext.trip.origin && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Origin:</span>
                            <span className="font-medium">{tripContext.trip.origin}</span>
                          </div>
                        )}
                        {tripContext.trip.destinations && tripContext.trip.destinations.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Destinations:</span>
                            <span className="font-medium">{tripContext.trip.destinations.join(', ')}</span>
                          </div>
                        )}
                        {tripContext.trip.dateRange && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Dates:</span>
                            <span className="font-medium">{tripContext.trip.dateRange.start || 'TBD'} → {tripContext.trip.dateRange.end || 'TBD'}</span>
                          </div>
                        )}
                        {tripContext.trip.travelers && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Travelers:</span>
                            <span className="font-medium">{tripContext.trip.travelers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Open Questions */}
                  {tripContext.openQuestions && tripContext.openQuestions.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold mb-2">❓ Open Questions</h3>
                        <ul className="space-y-1">
                          {tripContext.openQuestions.map((q, i) => (
                            <li key={i} className="text-xs bg-blue-50 border border-blue-200 rounded p-2 text-blue-900">
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Assumptions */}
                  {tripContext.assumptions && tripContext.assumptions.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold mb-2">💭 Assumptions</h3>
                        <ul className="space-y-1">
                          {tripContext.assumptions.map((a, i) => (
                            <li key={i} className="text-xs bg-purple-50 border border-purple-200 rounded p-2 text-purple-900">
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Full JSON */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="json">
                      <AccordionTrigger className="text-xs">View Full JSON</AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto custom-scrollbar">
                          {JSON.stringify(tripContext, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No trip context yet</p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* TASKS TAB */}
          <TabsContent value="tasks" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0">{task.specialist}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.taskName}</p>
                          <Accordion type="single" collapsible className="mt-2">
                            <AccordionItem value="details" className="border-0">
                              <AccordionTrigger className="text-xs py-1 hover:no-underline">
                                View Details
                              </AccordionTrigger>
                              <AccordionContent>
                                <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto custom-scrollbar">
                                  {JSON.stringify(task, null, 2)}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No tasks dispatched yet</p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* SPECIALISTS TAB */}
          <TabsContent value="specialists" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {specialistOutputs.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-2">
                  {specialistOutputs.map((output, idx) => (
                    <AccordionItem key={idx} value={`specialist-${idx}`} className="border rounded">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Badge>{output.agent}</Badge>
                          <span className="text-sm">{output.recommendations.length} recommendation(s)</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-600">Recommendations:</p>
                            <p className="text-xs text-slate-800">{output.recommendations.length} item(s)</p>
                          </div>
                          {output.questionsForUser.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600">Questions:</p>
                              <p className="text-xs text-slate-800">{output.questionsForUser.length} question(s)</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-600">Full Output:</p>
                            <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto custom-scrollbar mt-1">
                              {JSON.stringify(output, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-slate-500 italic">No specialist outputs yet</p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* MERGED TAB */}
          <TabsContent value="merged" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {mergedItinerary ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Summary</h3>
                    <p className="text-xs text-slate-700">{mergedItinerary.summary}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Days ({mergedItinerary.days.length})</h3>
                    <div className="space-y-2">
                      {mergedItinerary.days.map(day => (
                        <div key={day.dayNumber} className="bg-slate-50 rounded p-2 text-xs">
                          <p className="font-medium">Day {day.dayNumber}: {day.title}</p>
                          <p className="text-slate-600">{day.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <Accordion type="single" collapsible>
                    <AccordionItem value="json">
                      <AccordionTrigger className="text-xs">View Full JSON</AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto custom-scrollbar">
                          {JSON.stringify(mergedItinerary, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Itinerary will appear here after finalization</p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* RUN TAB */}
          <TabsContent value="run" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {masterOutput ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Master Agent Output</h3>
                    <div className="bg-slate-50 rounded p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Mode:</span>
                        <Badge variant={masterOutput.mode === 'FINALIZE' ? 'default' : 'secondary'}>
                          {masterOutput.mode}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Summary:</p>
                        <p className="text-xs text-slate-800">{masterOutput.shortSummary}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Next Step:</p>
                        <p className="text-xs text-slate-800">{masterOutput.nextStep}</p>
                      </div>
                    </div>
                  </div>

                  {masterOutput.questions && masterOutput.questions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Questions ({masterOutput.questions.length})</h3>
                        <ul className="space-y-1">
                          {masterOutput.questions.map((q, i) => (
                            <li key={i} className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {masterOutput.mode === 'DISPATCH' && masterOutput.tasks && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Tasks ({masterOutput.tasks.length})</h3>
                        <div className="space-y-2">
                          {masterOutput.tasks.map((task, i) => (
                            <div key={i} className="bg-slate-50 rounded p-2 text-xs">
                              <Badge variant="outline" className="mb-1">{task.specialist}</Badge>
                              <p className="text-slate-700">{task.taskName}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <Accordion type="single" collapsible>
                    <AccordionItem value="json">
                      <AccordionTrigger className="text-xs">View Full Master Output JSON</AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto custom-scrollbar">
                          {JSON.stringify(masterOutput, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No master output yet</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
