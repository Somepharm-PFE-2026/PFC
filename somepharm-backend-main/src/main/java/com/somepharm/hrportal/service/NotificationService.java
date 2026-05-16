package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.Notification;
import com.somepharm.hrportal.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getNotificationsForUser(Long idUser) {
        return notificationRepository.findByIdUserOrderByTimestampDesc(idUser);
    }

    public List<Notification> getUnreadNotificationsForUser(Long idUser) {
        return notificationRepository.findByIdUserAndIsReadFalseOrderByTimestampDesc(idUser);
    }

    @Transactional
    public void markAsRead(Long idNotification) {
        notificationRepository.findById(idNotification).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long idUser) {
        List<Notification> unread = notificationRepository.findByIdUserAndIsReadFalseOrderByTimestampDesc(idUser);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void createNotification(Long idUser, String message) {
        notificationRepository.save(new Notification(idUser, message));
    }
}
