package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public class FileControllerTests {
    @Value("${local.server.port}")
    private int randomServerPort;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private FileRepository fileRepository;

    @SuppressWarnings("resource")
    @Container
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:15.3")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
    }

    @Test
    public void whenGettingAllFiles_givenFilesExists_thenReturnsFiles() {
        // Arrange
        FileEntity file1 = new FileEntity();
        file1.setHash("abc");
        file1.setPath("/path/to/file1");
        file1.setActive(1);
        file1.setSize(12381231);
        file1.setMetadata(new HashMap<>());
        fileRepository.save(file1);

        FileEntity file2 = new FileEntity();
        file2.setHash("def");
        file2.setPath("/path/to/file2");
        file2.setActive(1);
        file2.setSize(431741);
        file2.setMetadata(new HashMap<>());
        fileRepository.save(file2);

        // Act
        ResponseEntity<List<FileEntity>> response = restTemplate.exchange(
            "http://localhost:" + randomServerPort + "/files",
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<>() {}
        );

        // Assert
        List<FileEntity> returnedFiles = response.getBody();
        assertThat(returnedFiles)
            .extracting(FileEntity::getPath)
            .containsExactlyInAnyOrder("/path/to/file1", "/path/to/file2");
    }
}
