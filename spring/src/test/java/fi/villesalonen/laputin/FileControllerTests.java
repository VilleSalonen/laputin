package fi.villesalonen.laputin;

import fi.villesalonen.laputin.builders.FileRecordBuilder;
import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.records.FileRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
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

import java.util.List;

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
    FileRepository fileRepository;
    @Autowired
    TagRepository tagRepository;

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

    @BeforeEach
    public void before() {
        fileRepository.deleteAll();
        tagRepository.deleteAll();
    }

    @Nested
    class QueryByHash {
        FileRecord file1 = new FileRecordBuilder().build();
        FileRecord file2 = new FileRecordBuilder().build();
        FileRecord file3 = new FileRecordBuilder().build();

        @BeforeEach
        public void beforeEach() {
            // Arrange
            fileRepository.save(FileEntity.fromRecord(file1));
            fileRepository.save(FileEntity.fromRecord(file2));
            fileRepository.save(FileEntity.fromRecord(file3));
        }

        @Test
        public void whenQueryingByHash_givenFilesExist_thenReturnsOnlyMatchingFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files?hash=" + file1.hash() + "&hash=" + file3.hash(),
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder(file1.path(), file3.path());
        }
    }

    @Nested
    class QueryByActive {
        FileRecord file1 = new FileRecordBuilder().build();
        FileRecord file2 = new FileRecordBuilder().build();
        FileRecord file3 = new FileRecordBuilder().withActive(false).build();

        @BeforeEach
        public void beforeEach() {
            // Arrange
            fileRepository.save(FileEntity.fromRecord(file1));
            fileRepository.save(FileEntity.fromRecord(file2));
            fileRepository.save(FileEntity.fromRecord(file3));
        }

        @Test
        public void whenQueryingByHash_givenFilesExist_thenReturnsOnlyMatchingFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder(file1.path(), file2.path());
        }

        @Test
        public void whenIncludeInactiveIsMissing_givenFilesExist_thenReturnsOnlyActiveFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder(file1.path(), file2.path());
        }

        @Test
        public void whenIncludeInactiveFalse_givenFilesExist_thenReturnsOnlyActiveFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files?includeInactive=false",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder(file1.path(), file2.path());
        }

        @Test
        public void whenIncludeInactiveTrue_givenFilesExist_thenReturnsAllFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files?includeInactive=true",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder(file1.path(), file2.path(), file3.path());
        }
    }
}
