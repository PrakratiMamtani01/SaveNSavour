import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, MinusCircle, Clock } from "lucide-react"

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentOrders: number;
  isActive: boolean;
}

interface PickupTimeSlotsProps {
  timeSlots: TimeSlot[];
  onChange: (timeSlots: TimeSlot[]) => void;
}

export function PickupTimeSlots({ timeSlots, onChange }: PickupTimeSlotsProps) {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const addTimeSlot = () => {
    onChange([
      ...timeSlots,
      {
        day: "Monday",
        startTime: "12:00",
        endTime: "14:00",
        maxOrders: 10,
        currentOrders: 0,
        isActive: true
      }
    ]);
  };
  
  const removeTimeSlot = (index: number) => {
    const updatedSlots = [...timeSlots];
    updatedSlots.splice(index, 1);
    onChange(updatedSlots);
  };
  
  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value
    };
    onChange(updatedSlots);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Pickup Time Slots</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addTimeSlot}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Time Slot
        </Button>
      </div>
      
      {timeSlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No time slots added. Click "Add Time Slot" to create pickup availability.
        </p>
      ) : (
        <div className="space-y-4">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex flex-col p-4 border rounded-md gap-4 bg-muted/30">
              <div className="flex justify-between">
                <h4 className="font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  Pickup Time Slot #{index + 1}
                </h4>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeTimeSlot(index)}
                >
                  <MinusCircle className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`day-${index}`}>Day</Label>
                  <Select 
                    value={slot.day} 
                    onValueChange={(value) => updateTimeSlot(index, 'day', value)}
                  >
                    <SelectTrigger id={`day-${index}`}>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`start-time-${index}`}>Start Time</Label>
                  <Input
                    id={`start-time-${index}`}
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`end-time-${index}`}>End Time</Label>
                  <Input
                    id={`end-time-${index}`}
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`max-orders-${index}`}>Max Orders</Label>
                  <Input
                    id={`max-orders-${index}`}
                    type="number"
                    min="1"
                    value={slot.maxOrders}
                    onChange={(e) => updateTimeSlot(index, 'maxOrders', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox 
                    id={`active-${index}`} 
                    checked={slot.isActive}
                    onCheckedChange={(checked) => updateTimeSlot(index, 'isActive', !!checked)}
                  />
                  <label htmlFor={`active-${index}`}>Active</label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}