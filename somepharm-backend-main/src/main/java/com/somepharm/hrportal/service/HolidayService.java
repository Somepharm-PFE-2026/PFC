package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.JourFerie;
import com.somepharm.hrportal.entity.RecurrenceType;
import com.somepharm.hrportal.repository.JourFerieRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HolidayService {

    private final JourFerieRepository jourFerieRepository;

    public HolidayService(JourFerieRepository jourFerieRepository) {
        this.jourFerieRepository = jourFerieRepository;
    }

    /**
     * Checks if a given date is a public holiday based on recurrence rules.
     */
    public boolean isHoliday(LocalDate date) {
        return jourFerieRepository.findAll().stream()
                .anyMatch(h -> matches(h, date));
    }

    /**
     * Returns holidays that should be visible (Annual, Periodic, or Unique in current/future years).
     */
    public List<JourFerie> getVisibleHolidays() {
        int currentYear = LocalDate.now().getYear();
        return jourFerieRepository.findAll().stream()
                .filter(h -> {
                    if (h.getRecurrenceType() == RecurrenceType.UNIQUE) {
                        return h.getDate().getYear() >= currentYear;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private boolean matches(JourFerie h, LocalDate date) {
        if (h.getRecurrenceType() == RecurrenceType.ANNUEL) {
            return h.getDate().getMonth() == date.getMonth() && h.getDate().getDayOfMonth() == date.getDayOfMonth();
        } else if (h.getRecurrenceType() == RecurrenceType.PERIODIQUE) {
            int yearsDiff = date.getYear() - h.getDate().getYear();
            int interval = h.getRecurrenceInterval() != null ? h.getRecurrenceInterval() : 1;
            return yearsDiff >= 0 && yearsDiff % interval == 0 
                    && h.getDate().getMonth() == date.getMonth() 
                    && h.getDate().getDayOfMonth() == date.getDayOfMonth();
        } else { // UNIQUE
            return h.getDate().equals(date);
        }
    }
}
