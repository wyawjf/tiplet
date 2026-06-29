package com.tiplet.api.repository;

import com.tiplet.api.model.WidgetSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WidgetSettingsRepository extends JpaRepository<WidgetSettings, String> {
}
